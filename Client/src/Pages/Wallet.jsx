import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { motion } from "framer-motion";
import {
  Coins,
  Gift,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

// ── Transaction type config ───────────────────────────────────────────────
const TRANSACTION_CONFIG = {
  earned_referral: {
    label: "Referral Bonus",
    icon: <ArrowUpCircle size={18} className="text-green-500" />,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  earned_referred: {
    label: "Welcome Bonus",
    icon: <ArrowUpCircle size={18} className="text-green-500" />,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  spent_mentorship: {
    label: "Used for Mentorship",
    icon: <ArrowDownCircle size={18} className="text-rose-500" />,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  spent_notes: {
    label: "Used for Notes",
    icon: <ArrowDownCircle size={18} className="text-rose-500" />,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
};

export default function Wallet() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loadingWallet) {
      navigate("/");
    }
  }, [user, loadingWallet]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
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
  }, []);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTx(true);
      try {
        const res = await fetch(`/api/wallet/transactions?page=1&limit=20`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setTransactions(data.transactions);
          setPagination(data.pagination);
          setPage(1);
        }
      } catch (err) {
        console.error("Transaction fetch error:", err);
      } finally {
        setLoadingTx(false);
      }
    };
    fetchTransactions();
  }, []);

  // Load more transactions
  const loadMore = async () => {
    if (!pagination?.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/wallet/transactions?page=${nextPage}&limit=20`,
        { credentials: "include" },
      );
      const data = await res.json();
      if (data.success) {
        setTransactions((prev) => [...prev, ...data.transactions]);
        setPagination(data.pagination);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loadingWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9f3562]" />
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Wallet</h1>
      {/* Refer & Earn shortcut — mobile friendly */}
      <Link
        to="/referrals"
        className="flex items-center justify-between bg-gradient-to-r from-[#9f3562]/10 to-[#c0556e]/10 border border-[#9f3562]/20 rounded-xl px-4 py-3 mb-6 hover:from-[#9f3562]/20 transition-all"
      >
        <div className="flex items-center gap-3">
          <Gift size={20} className="text-[#9f3562]" />
          <div>
            <p className="text-sm font-bold text-[#9f3562]">Refer & Earn</p>
            <p className="text-xs text-gray-500">Share your code, earn coins</p>
          </div>
        </div>
        <span className="text-[#9f3562] text-lg">→</span>
      </Link>

      {/* ── Coin Balance Card ─────────────────────────────── */}
      {wallet && (
        <div className="bg-gradient-to-br from-[#9f3562] to-[#c0556e] rounded-2xl p-6 text-white shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Coins size={22} />
            <span className="text-sm font-medium opacity-80">Coin Balance</span>
          </div>

          <div className="flex items-end gap-3 mb-1">
            <span className="text-5xl font-bold">{wallet.coinBalance}</span>
            <span className="text-lg opacity-80 mb-1">coins</span>
          </div>

          <p className="text-sm opacity-70 mb-4">
            = ₹{wallet.rupeesBalance.toFixed(2)}&nbsp;
            <span className="text-xs">(10 coins = ₹1)</span>
          </p>

          {/* Monthly cap progress */}
          <div className="bg-white/20 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium opacity-90">
                This month's earnings
              </span>
              <span className="text-xs font-bold">
                ₹{wallet.rupeesEarnedThisMonth} / ₹{wallet.monthlyCapRupees}
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${wallet.capReachedPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs opacity-70">
                {wallet.coinsEarnedThisMonth} coins earned
              </span>
              <span className="text-xs opacity-70">
                {wallet.remainingCapCoins} coins remaining
              </span>
            </div>
            {wallet.capReached && (
              <p className="text-xs mt-2 bg-white/20 rounded-lg px-3 py-1 text-center">
                🎯 Monthly cap reached. Resets on 1st of next month.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── How to use coins ─────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <TrendingUp size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              How to use your coins
            </p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Coins are automatically applied as a discount at checkout when
              buying mentorship plans or paid notes. You cannot withdraw coins
              as cash.
            </p>
          </div>
        </div>
      </div>

      {/* ── Transaction History ───────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Transaction History
        </h2>

        {loadingTx ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Coins size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No transactions yet.</p>
            <p className="text-xs mt-1">
              Refer friends or make a purchase to earn coins!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const config =
                TRANSACTION_CONFIG[tx.type] ||
                TRANSACTION_CONFIG.earned_referral;
              return (
                <motion.div
                  key={tx.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className={`flex items-center justify-between p-4 rounded-xl border border-gray-100 shadow-sm ${config.bg}`}
                >
                  <div className="flex items-center gap-3">
                    {config.icon}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-500">{tx.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${config.color}`}>
                      {tx.isEarned ? "+" : "-"}
                      {Math.abs(tx.coins)} coins
                    </p>
                    <p className="text-xs text-gray-400">
                      ₹{tx.rupeesValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Balance: {tx.balanceAfter}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* Load more */}
            {pagination?.hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-[#9f3562] transition-colors"
              >
                {loadingMore ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9f3562]" />
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Load more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
