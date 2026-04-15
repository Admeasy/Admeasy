import React, { useState } from "react";
import { X, CreditCard, Loader2 } from "lucide-react";

const PaymentModal = ({ note, isOpen, onClose, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
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

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError("Failed to load payment gateway. Please try again.");
      return;
    }

    const orderRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ noteId: note._id }),
    });

    if (!orderRes.ok) {
      const errorData = await orderRes.json();
      throw new Error(errorData.message || "Failed to create order");
    }

    const orderData = await orderRes.json();

    // ✅ Store payment data for retry
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
        
        // ✅ Retry verification up to 3 times
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
              // Success or already verified — do not expose raw file URLs; access via /api/notes/:id/pdf
              verified = true;
              if (typeof onPaymentSuccess === "function") {
                onPaymentSuccess(verifyData);
              }
              onClose();
              break;
            }
            
            // If not last attempt, wait before retry
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          } catch (err) {
            console.error(`Verification attempt ${attempt} failed:`, err);
            if (attempt === 3) {
              // Last attempt failed
              setError(
                "Payment successful but verification is taking time. " +
                "Your purchase will be available shortly. " +
                "Check 'My Purchases' or contact support if issue persists."
              );
              setLoading(false);
            }
          }
        }
        
        if (!verified) {
          setLoading(false);
        }
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#6C63FF",
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
          // ✅ If user dismisses modal but payment was made, show helpful message
          if (paymentResponse) {
            setError(
              "Payment window closed. If amount was debited, " +
              "your purchase will be available in 'My Purchases' within 5 minutes."
            );
          }
        }
      }
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
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>Price:</span>
              <span className="font-bold text-lg text-green-600">₹{note.price}</span>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              By proceeding with the payment, you agree to our terms and conditions.
              This is a one-time purchase for lifetime access to this note.
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
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
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{note.price}
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








