const User = require("../models/userSchema");
const CoinTransaction = require("../models/CoinTransaction");
const { coinsToRupees, MAX_MONTHLY_COINS } = require("../utils/coinHelper");

// ── HELPER ─────────────────────────────────────────────
function getUserIdFromReq(req) {
  return req.user?._id || null;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// -------------------------------------------------------
// 1️⃣ GET WALLET BALANCE
// GET /api/wallet/balance
// -------------------------------------------------------
exports.getWalletBalance = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const user = await User.findById(userId).select(
      "coinBalance coinsEarnedThisMonth coinMonthKey showFirstCoinPopup",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Reset monthly counter if month has changed
    const currentMonthKey = getCurrentMonthKey();
    if (user.coinMonthKey !== currentMonthKey) {
      user.coinsEarnedThisMonth = 0;
      user.coinMonthKey = currentMonthKey;
      await user.save({ validateBeforeSave: false });
    }

    const coinsEarnedThisMonth = user.coinsEarnedThisMonth || 0;
    const remainingCapCoins = Math.max(
      0,
      MAX_MONTHLY_COINS - coinsEarnedThisMonth,
    );

    return res.json({
      success: true,
      wallet: {
        // Coin balance
        coinBalance: user.coinBalance,
        rupeesBalance: coinsToRupees(user.coinBalance),

        // Monthly cap info
        coinsEarnedThisMonth,
        rupeesEarnedThisMonth: coinsToRupees(coinsEarnedThisMonth),
        monthlyCapCoins: MAX_MONTHLY_COINS,
        monthlyCapRupees: coinsToRupees(MAX_MONTHLY_COINS), // 500
        remainingCapCoins,
        remainingCapRupees: coinsToRupees(remainingCapCoins),
        capReachedPercent: Math.min(
          100,
          Math.round((coinsEarnedThisMonth / MAX_MONTHLY_COINS) * 100),
        ),
        capReached: remainingCapCoins === 0,

        // Popup flag — frontend checks this on load
        showFirstCoinPopup: user.showFirstCoinPopup || false,
      },
    });
  } catch (error) {
    console.error("getWalletBalance error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch wallet balance" });
  }
};

// -------------------------------------------------------
// 2️⃣ GET TRANSACTION HISTORY
// GET /api/wallet/transactions?page=1&limit=20
// -------------------------------------------------------
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      CoinTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CoinTransaction.countDocuments({ user: userId }),
    ]);

    // Format transactions for frontend display
    const formatted = transactions.map((t) => ({
      id: t._id,
      type: t.type,
      coins: t.coins, // positive = earned, negative = spent
      rupeesValue: coinsToRupees(Math.abs(t.coins)),
      balanceAfter: t.balanceAfter,
      description: t.description,
      date: t.createdAt,
      // Icon hint for frontend
      isEarned: t.coins > 0,
      label: getLabelForType(t.type),
    }));

    return res.json({
      success: true,
      transactions: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + transactions.length < total,
      },
    });
  } catch (error) {
    console.error("getTransactionHistory error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch transactions" });
  }
};

// ── HELPER: human readable label for transaction type ─────────────────────
function getLabelForType(type) {
  switch (type) {
    case "earned_referral":
      return "Referral Bonus";
    case "earned_referred":
      return "Welcome Bonus";
    case "spent_mentorship":
      return "Used for Mentorship";
    case "spent_notes":
      return "Used for Notes";
    default:
      return "Coin Transaction";
  }
}
