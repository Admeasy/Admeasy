import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Copy,
  Share2,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Gift,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function Referral() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [codeRes, statsRes] = await Promise.all([
          fetch("/api/referrals/my-code", { credentials: "include" }),
          fetch("/api/referrals/stats", { credentials: "include" }),
        ]);
        const codeData = await codeRes.json();
        const statsData = await statsRes.json();
        if (codeData.success) setData(codeData);
        if (statsData.success) setStats(statsData);
      } catch (err) {
        console.error("Referral fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopy = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!data?.referralCode) return;
    const shareText = `Join Admeasy using my referral code ${data.referralCode} and earn 10 coins on your first purchase! Sign up at https://admeasy.in`;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (err) {
        // user cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Share text copied to clipboard!");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
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
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Refer & Earn</h1>
      <p className="text-sm text-gray-500 mb-6">
        Earn 10 coins every time someone signs up and makes their first purchase
        using your code. They earn 10 coins too!
      </p>

      {/* ── How it works ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            icon: "🔗",
            title: "Share Code",
            desc: "Share your unique referral code with friends",
          },
          {
            icon: "✅",
            title: "They Sign Up",
            desc: "Friend signs up using your code",
          },
          {
            icon: "🪙",
            title: "Both Earn",
            desc: "You both get 10 coins on their first purchase",
          },
        ].map((step, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100"
          >
            <div className="text-2xl mb-1">{step.icon}</div>
            <p className="text-xs font-bold text-gray-700">{step.title}</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── Referral Code Card ────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#9f3562] to-[#c0556e] rounded-2xl p-6 text-white shadow-lg mb-6">
        <p className="text-sm opacity-80 mb-2 font-medium">
          Your Referral Code
        </p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-white/20 rounded-xl px-5 py-3 text-center">
            <span className="text-3xl font-bold tracking-widest">
              {data?.referralCode || "—"}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-[#9f3562] rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-100 transition-all"
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Code"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-white/30 transition-all"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────── */}
      {data?.stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-blue-500" />
              <span className="text-xs text-gray-500">Total Referred</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {data.stats.totalReferred}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-xs text-gray-500">Successful</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {data.stats.successful}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-amber-500" />
              <span className="text-xs text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {data.stats.pending}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              awaiting first purchase
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} className="text-[#9f3562]" />
              <span className="text-xs text-gray-500">Coins Earned</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {data.stats.totalCoinsEarnedFromReferrals}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              = ₹{data.stats.totalRupeesEarnedFromReferrals}
            </p>
          </div>
        </div>
      )}

      {/* ── Monthly Cap ───────────────────────────────────── */}
      {stats?.monthlyCap && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-[#9f3562]" />
            <span className="text-sm font-semibold text-gray-700">
              Monthly Earnings Cap
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              ₹{stats.monthlyCap.rupeesEarnedThisMonth} earned this month
            </span>
            <span>₹{stats.monthlyCap.monthlyCapRupees} cap</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
            <div
              className="bg-[#9f3562] rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${stats.monthlyCap.capReachedPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {stats.monthlyCap.capReached
              ? "🎯 Monthly cap reached. Resets on 1st of next month."
              : `₹${stats.monthlyCap.remainingCapRupees} remaining this month`}
          </p>
        </div>
      )}

      {/* ── Referral History Table ────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Referral History
        </h2>

        {!data?.referralHistory?.length ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No referrals yet.</p>
            <p className="text-xs mt-1">
              Share your code to start earning coins!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.referralHistory.map((r) => (
              <motion.div
                key={r.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {r.name}
                  </p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Joined {formatDate(r.joinedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                      r.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status === "completed" ? "✅ Success" : "⏳ Pending"}
                  </span>
                  {r.status === "completed" && (
                    <p className="text-xs text-green-600 font-semibold mt-1">
                      +{r.coinsEarned} coins
                    </p>
                  )}
                  {r.status === "pending" && (
                    <p className="text-xs text-gray-400 mt-1">
                      awaiting purchase
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
