import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Loader2,
  Coins,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUser } from "../context/UserContext";

const PaymentModal = ({ note, isOpen, onClose, onPaymentSuccess }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Coin state ────────────────────────────────────────
  const [wallet, setWallet] = useState(null);
  const [applyCoins, setApplyCoins] = useState(false);
  const [coinSummary, setCoinSummary] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Fetch wallet balance when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchWallet = async () => {
      setLoadingWallet(true);
      try {
        const res = await fetch("/api/wallet/balance", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setWallet(data.wallet);
      } catch (err) {
        console.error("Wallet fetch error:", err);
      } finally {
        setLoadingWallet(false);
      }
    };
    fetchWallet();
  }, [isOpen, user]);

  // Calculate coin discount when toggle changes
  useEffect(() => {
    if (!wallet || !note) return;
    if (!applyCoins) {
      setCoinSummary(null);
      return;
    }
    const originalAmount = Number(note.price);
    const maxCoinsUsable = Math.min(wallet.coinBalance, originalAmount * 10);
    const coinsDiscountInr = maxCoinsUsable / 10;
    const finalAmount = Math.max(0, originalAmount - coinsDiscountInr);
    setCoinSummary({
      originalAmount,
      coinsApplied: maxCoinsUsable,
      coinsDiscountInr,
      finalAmount,
    });
  }, [applyCoins, wallet, note]);

  const finalPayAmount = coinSummary
    ? coinSummary.finalAmount
    : Number(note?.price || 0);
  const isFullyCoveredByCoins = coinSummary && coinSummary.finalAmount === 0;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      // ── CASE: fully paid by coins ──────────────────────
      if (isFullyCoveredByCoins) {
        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ noteId: note._id, applyCoins: true }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok)
          throw new Error(orderData.message || "Failed to process");
        if (orderData.fullyPaidWithCoins) {
          if (typeof onPaymentSuccess === "function")
            onPaymentSuccess(orderData);
          onClose();
          return;
        }
      }

      // ── CASE: Razorpay payment (with or without coin discount) ──
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Failed to load payment gateway. Please try again.");
        return;
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ noteId: note._id, applyCoins }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const orderData = await orderRes.json();
      let paymentResponse = null;

      const options = {
        key: orderData.order.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Admeasy",
        description: `Purchase: ${note.title}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          paymentResponse = response;
          let verified = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              setLoading(true);
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  noteId: note._id,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok || verifyRes.status === 409) {
                verified = true;
                if (typeof onPaymentSuccess === "function")
                  onPaymentSuccess(verifyData);
                onClose();
                break;
              }
              if (attempt < 3) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 2000 * attempt),
                );
              }
            } catch (err) {
              console.error(`Verification attempt ${attempt} failed:`, err);
              if (attempt === 3) {
                setError(
                  "Payment successful but verification is taking time. " +
                    "Your purchase will be available shortly. " +
                    "Check 'My Purchases' or contact support if issue persists.",
                );
                setLoading(false);
              }
            }
          }
          if (!verified) setLoading(false);
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#9f3562" },
        modal: {
          ondismiss: function () {
            setLoading(false);
            if (paymentResponse) {
              setError(
                "Payment window closed. If amount was debited, " +
                  "your purchase will be available in 'My Purchases' within 5 minutes.",
              );
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setLoading(false);
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Purchase Note</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Note Info */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Original Price</span>
              <span className="font-bold text-lg text-gray-800">
                ₹{note.price}
              </span>
            </div>
          </div>

          {/* ── Coin Toggle ─────────────────────────────── */}
          {user && wallet && wallet.coinBalance > 0 && (
            <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setApplyCoins((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-amber-600" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-amber-800">
                      Use Coins
                    </p>
                    <p className="text-xs text-amber-600">
                      You have {wallet.coinBalance} coins = ₹
                      {wallet.rupeesBalance}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-5 rounded-full transition-colors ${
                      applyCoins ? "bg-amber-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        applyCoins ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                  {applyCoins ? (
                    <ChevronUp size={16} className="text-amber-600" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {/* Coin breakdown */}
              {applyCoins && coinSummary && (
                <div className="px-4 py-3 bg-white space-y-2 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Original price</span>
                    <span className="text-gray-700">
                      ₹{coinSummary.originalAmount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Coins used ({coinSummary.coinsApplied} coins)
                    </span>
                    <span className="text-green-600 font-semibold">
                      − ₹{coinSummary.coinsDiscountInr.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-700">You pay</span>
                    <span className="text-[#9f3562] text-base">
                      {coinSummary.finalAmount === 0
                        ? "₹0 (Free!)"
                        : `₹${coinSummary.finalAmount.toFixed(2)}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Coins are deducted only after successful payment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Loading wallet */}
          {user && loadingWallet && (
            <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              Checking coin balance...
            </div>
          )}

          {/* Order summary line */}
          <div className="flex items-center justify-between text-sm mb-4 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-gray-600 font-medium">Total to pay</span>
            <span className="text-xl font-bold text-[#9f3562]">
              ₹{finalPayAmount.toFixed(2)}
            </span>
          </div>

          {/* Info text */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mb-4">
            {isFullyCoveredByCoins
              ? "🎉 Your coins cover the full amount. No payment required!"
              : "By proceeding, you agree to our terms and conditions. This is a one-time purchase for lifetime access."}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#9f3562] text-white rounded-xl font-semibold hover:bg-[#b14270] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : isFullyCoveredByCoins ? (
                <>
                  <Coins className="w-4 h-4" />
                  Confirm with Coins
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{finalPayAmount.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
