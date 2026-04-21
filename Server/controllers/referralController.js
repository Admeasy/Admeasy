const User = require("../models/userSchema");
const Referral = require("../models/referralSchema");
const { coinsToRupees, MAX_MONTHLY_COINS } = require("../utils/coinHelper");

// ── HELPER: get user from request token ───────────────────────────────────
function getUserIdFromReq(req) {
  return req.user?._id || null;
}

// ── HELPER: get current month key ─────────────────────────────────────────
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// -------------------------------------------------------
// 1️⃣ GET MY REFERRAL CODE + STATS
// GET /api/referrals/my-code
// -------------------------------------------------------
exports.getMyReferralCode = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const user = await User.findById(userId).select(
      "referralCode coinBalance coinsEarnedThisMonth coinMonthKey name username",
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

    // Get all referrals made by this user
    const referrals = await Referral.find({ referrer: userId })
      .populate("referred", "name username email createdAt")
      .sort({ createdAt: -1 });

    const totalReferred = referrals.length;
    const successfulReferrals = referrals.filter(
      (r) => r.status === "completed",
    );
    const pendingReferrals = referrals.filter((r) => r.status === "pending");
    const totalCoinsEarnedFromReferrals = successfulReferrals.reduce(
      (sum, r) => sum + (r.coinsAwardedToReferrer || 0),
      0,
    );

    // Build referral history list for frontend table
    const referralHistory = referrals.map((r) => ({
      id: r._id,
      name: r.referred?.name || r.referred?.username || "Unknown",
      email: r.referred?.email
        ? r.referred.email.replace(/(.{2}).+(@.+)/, "$1***$2") // mask email
        : "—",
      status: r.status,
      coinsEarned: r.coinsAwardedToReferrer || 0,
      joinedAt: r.createdAt,
      completedAt: r.completedAt || null,
    }));

    return res.json({
      success: true,
      referralCode: user.referralCode,
      stats: {
        totalReferred,
        successful: successfulReferrals.length,
        pending: pendingReferrals.length,
        totalCoinsEarnedFromReferrals,
        totalRupeesEarnedFromReferrals: coinsToRupees(
          totalCoinsEarnedFromReferrals,
        ),
      },
      referralHistory,
    });
  } catch (error) {
    console.error("getMyReferralCode error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch referral data" });
  }
};

// -------------------------------------------------------
// 2️⃣ VALIDATE REFERRAL CODE
// POST /api/referrals/validate
// Body: { referralCode: "ABC123" }
// Called by signup form on blur — no auth required
// -------------------------------------------------------
exports.validateReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode || !referralCode.trim()) {
      return res
        .status(400)
        .json({
          success: false,
          valid: false,
          message: "Referral code is required",
        });
    }

    const referrer = await User.findOne({
      referralCode: referralCode.toUpperCase().trim(),
    }).select("referralCode name username");

    if (!referrer) {
      return res.json({
        success: true,
        valid: false,
        message: "Invalid referral code",
      });
    }

    return res.json({
      success: true,
      valid: true,
      message: "Valid referral code!",
      referrerName: referrer.name || referrer.username || "A user", // show who referred them
    });
  } catch (error) {
    console.error("validateReferralCode error:", error);
    return res
      .status(500)
      .json({ success: false, valid: false, message: "Validation failed" });
  }
};

// -------------------------------------------------------
// 3️⃣ GET REFERRAL STATS (monthly cap info)
// GET /api/referrals/stats
// -------------------------------------------------------
exports.getReferralStats = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const user = await User.findById(userId).select(
      "coinBalance coinsEarnedThisMonth coinMonthKey",
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
    const monthlyCapCoins = MAX_MONTHLY_COINS; // 5000
    const remainingCapCoins = Math.max(
      0,
      monthlyCapCoins - coinsEarnedThisMonth,
    );
    const capReachedPercent = Math.min(
      100,
      Math.round((coinsEarnedThisMonth / monthlyCapCoins) * 100),
    );

    return res.json({
      success: true,
      wallet: {
        coinBalance: user.coinBalance,
        rupeesBalance: coinsToRupees(user.coinBalance),
      },
      monthlyCap: {
        coinsEarnedThisMonth,
        rupeesEarnedThisMonth: coinsToRupees(coinsEarnedThisMonth),
        monthlyCapCoins,
        monthlyCapRupees: coinsToRupees(monthlyCapCoins), // 500
        remainingCapCoins,
        remainingCapRupees: coinsToRupees(remainingCapCoins),
        capReachedPercent,
        capReached: remainingCapCoins === 0,
      },
    });
  } catch (error) {
    console.error("getReferralStats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch referral stats" });
  }
};

// -------------------------------------------------------
// 4️⃣ DISMISS FIRST COIN POPUP
// POST /api/referrals/dismiss-popup
// Called by frontend after showing the popup once
// -------------------------------------------------------
exports.dismissFirstCoinPopup = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    await User.findByIdAndUpdate(userId, { showFirstCoinPopup: false });

    return res.json({ success: true });
  } catch (error) {
    console.error("dismissFirstCoinPopup error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to dismiss popup" });
  }
};
