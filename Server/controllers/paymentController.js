const Razorpay = require("razorpay");
const Payment = require("../models/paymentSchema");
const Note = require("../models/noteSchema");
const SubscriptionPlan = require("../models/subscriptionPlanSchema");
const Subscription = require("../models/subscriptionSchema");
const crypto = require("crypto");

// Razorpay must work in development too when keys are set (subscriptions / note purchases).
let razorpay = null;
const razorpayKeysPresent =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

<<<<<<< Updated upstream
/**
 * code to run server locally withput env variables(changes from line 17 to line 24)
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder",
});
=======
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
  console.warn(
    "Razorpay not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Server/.env",
  );
}

function paymentGatewayUnavailable(res) {
  return res.status(503).json({
    success: false,
    message:
      "Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server environment.",
  });
}
>>>>>>> Stashed changes

// -------------------------------------------------------
// 1️⃣ CREATE ORDER
// -------------------------------------------------------
exports.createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return paymentGatewayUnavailable(res);
    }

    const { noteId } = req.body;
    const userId = req.user?._id || req.mentor?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const note = await Note.findById(noteId);
    if (!note || note.isFree) {
      return res.status(400).json({ success: false, message: "Invalid note" });
    }

    // ✅ Check for ANY non-failed payment (completed OR pending)
    const existing = await Payment.findOne({
      user: userId,
      note: noteId,
      paymentType: "note",
      status: { $in: ["completed", "pending"] }, // ← KEY CHANGE
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

    const order = await razorpay.orders.create({
      amount: Math.round(Number(note.price) * 100),
      currency: "INR",
      receipt: `note_${noteId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      payment_capture: 1,
    });

    // ✅ Create pending payment record IMMEDIATELY
    await Payment.create({
      user: userId,
      note: noteId,
      paymentType: "note",
      amount: note.price,
      razorpayOrderId: order.id,
      status: "pending", // ← Prevents duplicate orders
    });

    return res.json({
      success: true,
      order: { ...order, key: process.env.RAZORPAY_KEY_ID },
      note: { id: note._id, title: note.title, price: note.price },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create order" });
  }
};

// -------------------------------------------------------
// 2️⃣ VERIFY PAYMENT (IDEMPOTENT & SAFE)
// -------------------------------------------------------
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      noteId,
    } = req.body;
    // const userId = req.user._id;
    const userId = req.user?._id || req.mentor?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    // Verify signature
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const note = await Note.findById(noteId);
    if (!note || note.isFree) {
      return res.status(400).json({ success: false, message: "Invalid note" });
    }

    // ✅ ATOMIC UPDATE - Only ONE request will succeed
    const payment = await Payment.findOneAndUpdate(
      {
        razorpayOrderId: razorpay_order_id,
        paymentType: "note",
        status: "pending", // ← Only update if still pending
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
      // Either doesn't exist or already completed
      const existing = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: "Payment record not found" });
      }

      if (existing.status === "completed") {
        // Already processed - return success (idempotent)
        return res.json({
          success: true,
          message: "Payment already verified",
          hasAccess: true,
          noteId: note._id,
        });
      }
    }

    return res.json({
      success: true,
      message: "Payment verified",
      hasAccess: true,
      noteId: note._id,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

// -------------------------------------------------------
// 3️⃣ CHECK PURCHASE
// -------------------------------------------------------
exports.checkPurchase = async (req, res) => {
  try {
    const { noteId } = req.params;
    // const userId = req.user._id;
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

    return res.json({
      success: true,
      hasPurchased: !!payment,
    });
  } catch (error) {
    console.error("Check purchase error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to check purchase" });
  }
};

// -------------------------------------------------------
// 4️⃣ GET USER PURCHASE HISTORY
// -------------------------------------------------------
exports.getUserPurchases = async (req, res) => {
  try {
    // const userId = req.user._id;
    const userId = req.user?._id || req.mentor?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });

    const payments = await Payment.find({
      user: userId,
      status: "completed",
    })
      .populate("note", "title description price isFree standard course")
      .sort({ paymentDate: -1 });

    return res.json({
      success: true,
      purchases: payments,
    });
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
    if (!razorpay) {
      return paymentGatewayUnavailable(res);
    }

    const { planId, mentorId, billingPeriod } = req.body;
    const userId = req.user._id;

    if (!planId || !mentorId || !billingPeriod) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid subscription plan" });
    }

    // Check if user already has an active subscription to this mentor
    const existingSubscription = await Subscription.findOne({
      user: userId,
      mentor: mentorId,
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription to this mentor",
      });
    }

    const price = plan.price[billingPeriod];
    if (!price) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid billing period" });
    }

    // Generate short receipt (max 40 chars for Razorpay)
    // Format: sub_<last6chars>_<timestamp>
    const shortPlanId = planId.toString().slice(-6);
    const timestamp = Date.now().toString().slice(-10);
    const receipt = `sub_${shortPlanId}_${timestamp}`;

    const order = await razorpay.orders.create({
      amount: Math.round(Number(price) * 100),
      currency: "INR",
      receipt: receipt.length > 40 ? receipt.slice(0, 40) : receipt,
      payment_capture: 1,
    });

    // Create pending payment record
    const payment = await Payment.create({
      user: userId,
      subscriptionPlan: planId,
      mentor: mentorId,
      billingPeriod: billingPeriod,
      paymentType: "subscription",
      amount: price,
      razorpayOrderId: order.id,
      status: "pending",
    });

    return res.json({
      success: true,
      order: { ...order, key: process.env.RAZORPAY_KEY_ID },
      plan: { id: plan._id, name: plan.name, price: price },
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Subscription order creation error:", error);
    const message =
      error?.error?.description ||
      error?.message ||
      "Failed to create subscription order";
    return res.status(500).json({ success: false, message });
  }
};

// -------------------------------------------------------
// 6️⃣ VERIFY SUBSCRIPTION PAYMENT
// -------------------------------------------------------
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;
    const userId = req.user._id;

    // Verify signature
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // Find and update payment
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

      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: "Payment record not found" });
      }

      if (existing.status === "completed") {
        // Already processed - return success (idempotent)
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

    // Create subscription
    const plan = await SubscriptionPlan.findById(payment.subscriptionPlan);
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
      startDate: startDate,
      endDate: endDate,
      payment: payment._id,
    });

    return res.json({
      success: true,
      message: "Subscription activated successfully",
      subscription: subscription,
    });
  } catch (error) {
    console.error("Verify subscription payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Subscription payment verification failed",
    });
  }
};

// -------------------------------------------------------
// 7️⃣ GET ALL PAYMENTS (ADMIN)
// -------------------------------------------------------
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email username")
      .populate("note", "title")
      .populate("subscriptionPlan", "name")
      .populate("mentor", "name username email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      payments: payments,
    });
  } catch (error) {
    console.error("Fetch all payments error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
  }
};
