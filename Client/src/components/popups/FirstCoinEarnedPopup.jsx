import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, X, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function FirstCoinEarnedPopup() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [wallet, setWallet] = useState(null);

  // Show popup if showFirstCoinPopup flag is true on user object
  useEffect(() => {
    if (user?.showFirstCoinPopup) {
      // Fetch latest wallet to show correct balance
      fetch("/api/wallet/balance", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setWallet(data.wallet);
        })
        .catch(console.error);

      setShow(true);
    }
  }, [user?.showFirstCoinPopup]);

  const handleDismiss = async () => {
    setShow(false);

    // Reset flag on backend
    try {
      await fetch("/api/referrals/dismiss-popup", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Dismiss popup error:", err);
    }

    // Reset flag on user object in context so it doesn't show again
    setUser((prev) => ({ ...prev, showFirstCoinPopup: false }));
  };

  const handleViewWallet = async () => {
    await handleDismiss();
    navigate("/wallet");
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleDismiss}
          />

          {/* Popup */}
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl pointer-events-auto overflow-hidden">
              {/* Top gradient banner */}
              <div className="bg-gradient-to-br from-[#9f3562] to-[#c0556e] px-6 pt-8 pb-6 text-white text-center relative">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>

                {/* Animated coin icon */}
                <motion.div
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Coins size={32} className="text-yellow-300" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold mb-1"
                >
                  🎉 You earned 10 coins!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm opacity-80"
                >
                  Someone you referred just made their first purchase!
                </motion.p>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {/* Coin info */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-center">
                  <p className="text-3xl font-bold text-amber-700 mb-1">
                    +10 coins
                  </p>
                  <p className="text-sm text-amber-600">
                    = ₹1 added to your wallet
                  </p>
                </div>

                {/* Wallet balance */}
                {wallet && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Wallet size={16} />
                      <span className="text-sm">Wallet Balance</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">
                        {wallet.coinBalance} coins
                      </p>
                      <p className="text-xs text-gray-400">
                        = ₹{wallet.rupeesBalance}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center mb-5">
                  Use your coins for a discount on your next mentorship or notes
                  purchase.
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleViewWallet}
                    className="flex-1 px-4 py-2.5 bg-[#9f3562] text-white rounded-xl text-sm font-semibold hover:bg-[#b14270] transition-colors"
                  >
                    View Wallet
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
