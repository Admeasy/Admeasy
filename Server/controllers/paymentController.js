const Razorpay = require("razorpay");
const Payment = require("../models/paymentSchema");
const Note = require("../models/noteSchema");
const SubscriptionPlan = require("../models/subscriptionPlanSchema");
const Subscription = require("../models/subscriptionSchema");
const crypto = require("crypto");
const User = require("../models/userSchema");
const Referral = require("../models/referralSchema");
const CoinTransaction = require("../models/CoinTransaction");
const {
  COINS_PER_REFERRAL,
  getAwardableCoins,
  coinsToRupees,
  rupeesToCoins,
} = require("../utils/coinHelper");

let razorpay = null;
const razorpayKeysPresent =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

if (razorpayKeysPresent) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.error("Failed to initialize Razorpay:", err);
  }
} else {
  console.warn("Razorpay not configured");
}

function paymentGatewayUnavailable(res) {
  return res.status(503).json({
    success: false,
    message: "Payment gateway is not configured.",
  });
}

// ── HELPER: Get current month key e.g. "2024-03" ──────────────────────────
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── HELPER: Reset monthly counter if month has changed ────────────────────
async function ensureMonthlyCounterFresh(user) {
  const currentMonthKey = getCurrentMonthKey();
  if (user.coinMonthKey !== currentMonthKey) {
    user.coinsEarnedThisMonth = 0;
    user.coinMonthKey = currentMonthKey;
    await user.save({ validateBeforeSave: false });
  }
}

// ── HELPER: Award coins to a user (respects monthly cap) ──────────────────
async function awardCoins(
  userId,
  coinsToAward,
  type,
  description,
  referenceId,
) {
  const user = await User.findById(userId);
  if (!user) return 0;

  await ensureMonthlyCounterFresh(user);

  const awardable = getAwardableCoins(user.coinsEarnedThisMonth, coinsToAward);
  if (awardable <= 0) return 0;

  user.coinBalance += awardable;
  user.coinsEarnedThisMonth += awardable;
  await user.save({ validateBeforeSave: false });

  await CoinTransaction.create({
    user: userId,
    type,
    coins: awardable,
    balanceAfter: user.coinBalance,
    description,
    referenceId,
    referenceModel: "Referral",
  });

  return awardable;
}

// ── HELPER: Handle first purchase coin logic ───────────────────────────────
async function handleFirstPurchaseCoinLogic(userId) {
  const user = await User.findById(userId);
  if (!user || user.hasCompletedFirstPurchase) return;

  // Mark first purchase done
  user.hasCompletedFirstPurchase = true;

  // Check if this user was referred
  const referral = await Referral.findOne({
    referred: userId,
    status: "pending",
  });

  if (referral) {
    // Award coins to referred user (this user)
    const coinsForReferred = await awardCoins(
      userId,
      COINS_PER_REFERRAL,
      "earned_referred",
      "Welcome bonus — coins earned on first purchase",
      referral._id,
    );

    // Award coins to referrer
    const referrerUser = await User.findById(referral.referrer);
    const referrerName =
      referrerUser?.name || referrerUser?.username || "Someone";

    const coinsForReferrer = await awardCoins(
      referral.referrer,
      COINS_PER_REFERRAL,
      "earned_referral",
      `Referral bonus — ${user.name || user.username || "A user"} made their first purchase`,
      referral._id,
    );

    // Mark referral as completed
    referral.status = "completed";
    referral.completedAt = new Date();
    referral.coinsAwardedToReferred = coinsForReferred;
    referral.coinsAwardedToReferrer = coinsForReferrer;
    await referral.save();

    // Set popup flags on both users
    // Referred user popup
    user.showFirstCoinPopup = true;

    // Referrer popup — reload referrer to set flag
    if (coinsForReferrer > 0) {
      await User.findByIdAndUpdate(referral.referrer, {
        showFirstCoinPopup: true,
      });
    }
  }

  await user.save({ validateBeforeSave: false });
}

// ── HELPER: Deduct coins after successful payment ─────────────────────────
async function deductCoins(payment, itemType) {
  if (payment.coinDeducted || payment.coinsApplied <= 0) return;

  const user = await User.findById(payment.user);
  if (!user) return;

  user.coinBalance = Math.max(0, user.coinBalance - payment.coinsApplied);
  await user.save({ validateBeforeSave: false });

  await CoinTransaction.create({
    user: payment.user,
    type: itemType === "subscription" ? "spent_mentorship" : "spent_notes",
    coins: -payment.coinsApplied,
    balanceAfter: user.coinBalance,
    description: `Coins used for ${itemType === "subscription" ? "mentorship" : "notes"} purchase`,
    referenceId: payment._id,
    referenceModel: "Order",
  });

  payment.coinDeducted = true;
  await payment.save();
}

// -------------------------------------------------------
// 1️⃣ CREATE ORDER (notes)
// -------------------------------------------------------
exports.createOrder = async (req, res) => {
  try {
    if (!razorpay) return paymentGatewayUnavailable(res);

    const { noteId, applyCoins = false } = req.body; // ← added applyCoins
    const userId = req.user?._id || req.mentor?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const note = await Note.findById(noteId);
    if (!note || note.isFree)
      return res.status(400).json({ success: false, message: "Invalid note" });

    const existing = await Payment.findOne({
      user: userId,
      note: noteId,
      paymentType: "note",
      status: { $in: ["completed", "pending"] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === "completed"
            ? "Already purchased"
            : "Payment already in progress",
      });
    }

    // ── COIN DISCOUNT LOGIC ──────────────────────────────
    const originalAmount = Number(note.price);
    let coinsApplied = 0;
    let coinsDiscountInr = 0;
    let finalAmount = originalAmount;

    if (applyCoins) {
      // Only users (not mentors) can use coins
      const user = await User.findById(userId);
      if (user && user.coinBalance > 0) {
        // Max coins usable = min(user balance, price in coins)
        const maxCoinsUsable = Math.min(
          user.coinBalance,
          rupeesToCoins(originalAmount), // e.g. ₹99 = 990 coins max
        );
        coinsApplied = maxCoinsUsable;
        coinsDiscountInr = coinsToRupees(coinsApplied); // coins / 10
        finalAmount = Math.max(0, originalAmount - coinsDiscountInr);
      }
    }
    // ────────────────────────────────────────────────────

    // If coins cover full price, no Razorpay order needed
    if (finalAmount === 0) {
      const payment = await Payment.create({
        user: userId,
        note: noteId,
        paymentType: "note",
        amount: originalAmount,
        originalAmount,
        coinsApplied,
        coinsDiscountInr,
        razorpayAmount: 0,
        status: "completed", // ← fully paid by coins
        coinDeducted: false, // deducted below
        paymentDate: new Date(),
      });

      await deductCoins(payment, "note");
      await handleFirstPurchaseCoinLogic(userId.toString());

      return res.json({
        success: true,
        fullyPaidWithCoins: true,
        message: "Purchase completed using coins",
        noteId: note._id,
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // ← discounted amount in paise
      currency: "INR",
      receipt: `note_${noteId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      payment_capture: 1,
    });

    await Payment.create({
      user: userId,
      note: noteId,
      paymentType: "note",
      amount: finalAmount,
      originalAmount,
      coinsApplied,
      coinsDiscountInr,
      razorpayAmount: Math.round(finalAmount * 100),
      razorpayOrderId: order.id,
      status: "pending",
      coinDeducted: false,
    });

    return res.json({
      success: true,
      order: { ...order, key: process.env.RAZORPAY_KEY_ID },
      note: { id: note._id, title: note.title, price: note.price },
      // ← send coin info to frontend for display
      coinSummary: {
        originalAmount,
        coinsApplied,
        coinsDiscountInr,
        finalAmount,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create order" });
  }
};

// -------------------------------------------------------
// 2️⃣ VERIFY PAYMENT (notes)
// -------------------------------------------------------
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      noteId,
    } = req.body;
    const userId = req.user?._id || req.mentor?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });

    const note = await Note.findById(noteId);
    if (!note || note.isFree)
      return res.status(400).json({ success: false, message: "Invalid note" });

    const payment = await Payment.findOneAndUpdate(
      {
        razorpayOrderId: razorpay_order_id,
        paymentType: "note",
        status: "pending",
      },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "completed",
          paymentDate: new Date(),
        },
      },
      { new: true },
    );

    if (!payment) {
      const existing = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
      });
      if (!existing)
        return res
          .status(404)
          .json({ success: false, message: "Payment record not found" });
      if (existing.status === "completed") {
        return res.json({
          success: true,
          message: "Payment already verified",
          hasAccess: true,
          noteId: note._id,
        });
      }
    }

    // ── COIN LOGIC AFTER PAYMENT SUCCESS ──────────────────
    // 1. Deduct coins from user balance (NOW, after payment confirmed)
    await deductCoins(payment, "note");

    // 2. Handle first purchase — award referral coins if applicable
    await handleFirstPurchaseCoinLogic(userId.toString());
    // ──────────────────────────────────────────────────────

    return res.json({
      success: true,
      message: "Payment verified",
      hasAccess: true,
      noteId: note._id,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

// -------------------------------------------------------
// 3️⃣ CHECK PURCHASE — unchanged
// -------------------------------------------------------
exports.checkPurchase = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user?._id || req.mentor?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const payment = await Payment.findOne({
      user: userId,
      note: noteId,
      status: "completed",
      paymentType: "note",
    });

    return res.json({ success: true, hasPurchased: !!payment });
  } catch (error) {
    console.error("Check purchase error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to check purchase" });
  }
};

// -------------------------------------------------------
// 4️⃣ GET USER PURCHASE HISTORY — unchanged
// -------------------------------------------------------
exports.getUserPurchases = async (req, res) => {
  try {
    const userId = req.user?._id || req.mentor?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const payments = await Payment.find({ user: userId, status: "completed" })
      .populate("note", "title description price isFree standard course")
      .sort({ paymentDate: -1 });

    return res.json({ success: true, purchases: payments });
  } catch (error) {
    console.error("Fetch history error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch purchases" });
  }
};

// -------------------------------------------------------
// 5️⃣ CREATE SUBSCRIPTION ORDER
// -------------------------------------------------------
exports.createSubscriptionOrder = async (req, res) => {
  try {
    if (!razorpay) return paymentGatewayUnavailable(res);

    const { planId, mentorId, billingPeriod, applyCoins = false } = req.body; // ← added applyCoins
    const userId = req.user._id;

    if (!planId || !mentorId || !billingPeriod)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan)
      return res
        .status(400)
        .json({ success: false, message: "Invalid subscription plan" });

    const existingSubscription = await Subscription.findOne({
      user: userId,
      mentor: mentorId,
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (existingSubscription)
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription to this mentor",
      });

    const price = plan.price[billingPeriod];
    if (!price)
      return res
        .status(400)
        .json({ success: false, message: "Invalid billing period" });

    // ── COIN DISCOUNT LOGIC ──────────────────────────────
    const originalAmount = Number(price);
    let coinsApplied = 0;
    let coinsDiscountInr = 0;
    let finalAmount = originalAmount;

    if (applyCoins) {
      const user = await User.findById(userId);
      if (user && user.coinBalance > 0) {
        const maxCoinsUsable = Math.min(
          user.coinBalance,
          rupeesToCoins(originalAmount),
        );
        coinsApplied = maxCoinsUsable;
        coinsDiscountInr = coinsToRupees(coinsApplied);
        finalAmount = Math.max(0, originalAmount - coinsDiscountInr);
      }
    }
    // ────────────────────────────────────────────────────

    // If coins cover full price
    if (finalAmount === 0) {
      const payment = await Payment.create({
        user: userId,
        subscriptionPlan: planId,
        mentor: mentorId,
        billingPeriod,
        paymentType: "subscription",
        amount: originalAmount,
        originalAmount,
        coinsApplied,
        coinsDiscountInr,
        razorpayAmount: 0,
        status: "completed",
        coinDeducted: false,
        paymentDate: new Date(),
      });

      await deductCoins(payment, "subscription");
      await handleFirstPurchaseCoinLogic(userId.toString());

      // Create subscription directly
      const startDate = new Date();
      const endDate = new Date();
      if (billingPeriod === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscription = await Subscription.create({
        user: userId,
        mentor: mentorId,
        plan: planId,
        billingPeriod,
        status: "active",
        startDate,
        endDate,
        payment: payment._id,
      });

      return res.json({
        success: true,
        fullyPaidWithCoins: true,
        message: "Subscription activated using coins",
        subscription,
      });
    }

    const shortPlanId = planId.toString().slice(-6);
    const timestamp = Date.now().toString().slice(-10);
    const receipt = `sub_${shortPlanId}_${timestamp}`;

    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // ← discounted amount
      currency: "INR",
      receipt: receipt.length > 40 ? receipt.slice(0, 40) : receipt,
      payment_capture: 1,
    });

    const payment = await Payment.create({
      user: userId,
      subscriptionPlan: planId,
      mentor: mentorId,
      billingPeriod,
      paymentType: "subscription",
      amount: finalAmount,
      originalAmount,
      coinsApplied,
      coinsDiscountInr,
      razorpayAmount: Math.round(finalAmount * 100),
      razorpayOrderId: order.id,
      status: "pending",
      coinDeducted: false,
    });

    return res.json({
      success: true,
      order: { ...order, key: process.env.RAZORPAY_KEY_ID },
      plan: { id: plan._id, name: plan.name, price },
      paymentId: payment._id,
      // ← send coin info to frontend
      coinSummary: {
        originalAmount,
        coinsApplied,
        coinsDiscountInr,
        finalAmount,
      },
    });
  } catch (error) {
    console.error("Subscription order creation error:", error);
    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.message ||
        "Failed to create subscription order",
    });
  }
};

// -------------------------------------------------------
// 6️⃣ VERIFY SUBSCRIPTION PAYMENT
// -------------------------------------------------------
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    console.log("=== verifySubscriptionPayment START ===");
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;
    console.log("paymentId:", paymentId, "orderId:", razorpay_order_id);
    const userId = req.user._id;
    console.log("userId:", userId);

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });

    const payment = await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        user: userId,
        razorpayOrderId: razorpay_order_id,
        status: "pending",
        paymentType: "subscription",
      },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "completed",
          paymentDate: new Date(),
        },
      },
      { new: true },
    );

    if (!payment) {
      const existing = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
      });
      if (!existing)
        return res
          .status(404)
          .json({ success: false, message: "Payment record not found" });
      if (existing.status === "completed") {
        const existingSub = await Subscription.findOne({
          payment: existing._id,
        });
        return res.json({
          success: true,
          message: "Payment already verified",
          subscription: existingSub,
        });
      }
    }

    // ── COIN LOGIC AFTER PAYMENT SUCCESS ──────────────────
    await deductCoins(payment, "subscription");
    await handleFirstPurchaseCoinLogic(userId.toString());
    // ──────────────────────────────────────────────────────

    const startDate = new Date();
    const endDate = new Date();
    if (payment.billingPeriod === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = await Subscription.create({
      user: userId,
      mentor: payment.mentor,
      plan: payment.subscriptionPlan,
      billingPeriod: payment.billingPeriod,
      status: "active",
      startDate,
      endDate,
      payment: payment._id,
    });

    return res.json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
    });
  } catch (error) {
    // console.error("Verify subscription payment error:", error);
    console.error("Verify subscription payment error DETAILS:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return res.status(500).json({
      success: false,
      message: "Subscription payment verification failed",
      debug: error.message,
    });
  }
};

// -------------------------------------------------------
// 7️⃣ GET ALL PAYMENTS (ADMIN) — unchanged
// -------------------------------------------------------
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email username")
      .populate("note", "title")
      .populate("subscriptionPlan", "name")
      .populate("mentor", "name username email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, payments });
  } catch (error) {
    console.error("Fetch all payments error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
  }
};
