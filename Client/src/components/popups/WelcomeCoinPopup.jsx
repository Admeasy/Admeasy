import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, X, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

// This popup is shown ONCE to a referred user after their first purchase succeeds.
// It is triggered by the parent (payment success handler) not by user context flag.
// Props:
//   isOpen: boolean  — controlled by parent (PaymentModal success callback)
//   onClose: fn      — called when user dismisses

export default function WelcomeCoinPopup({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);

  // Fetch wallet balance when popup opens
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/wallet/balance", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setWallet(data.wallet);
      })
      .catch(console.error);
  }, [isOpen]);

  const handleDismiss = () => {
    // Mark in localStorage so it never shows again on this device
    localStorage.setItem("admeasy:welcomeCoinsShown", "true");
    onClose();
  };

  const handleViewWallet = () => {
    handleDismiss();
    navigate("/wallet");
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
              {/* Top banner */}
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 pt-8 pb-6 text-white text-center relative">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>

                {/* Animated gift icon */}
                <motion.div
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Gift size={32} className="text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold mb-1"
                >
                  🎁 Welcome Bonus!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm opacity-90"
                >
                  You earned coins for making your first purchase!
                </motion.p>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {/* Coin earned highlight */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Coins size={20} className="text-amber-600" />
                    <p className="text-3xl font-bold text-amber-700">
                      +10 coins
                    </p>
                  </div>
                  <p className="text-sm text-amber-600">
                    = ₹1 added to your wallet
                  </p>
                </div>

                {/* Wallet balance if loaded */}
                {wallet && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Your wallet balance
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">
                          {wallet.coinBalance} coins
                        </p>
                        <p className="text-xs text-gray-400">
                          = ₹{wallet.rupeesBalance}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* How coins work */}
                <div className="space-y-2 mb-5">
                  {[
                    { icon: "🪙", text: "10 coins = ₹1 discount at checkout" },
                    {
                      icon: "🎓",
                      text: "Use on mentorship plans or paid notes",
                    },
                    { icon: "♾️", text: "Coins never expire" },
                    { icon: "👥", text: "Refer friends to earn more coins" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <p className="text-xs text-gray-600">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Got it!
                  </button>
                  <button
                    onClick={handleViewWallet}
                    className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
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
