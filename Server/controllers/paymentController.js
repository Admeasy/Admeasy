const Razorpay = require('razorpay');
const Payment = require('../models/paymentSchema');
const Note = require('../models/noteSchema');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// -------------------------------------------------------
// 1️⃣ CREATE ORDER
// -------------------------------------------------------
exports.createOrder = async (req, res) => {
  try {
    const { noteId } = req.body;
    const userId = req.user._id;

    const note = await Note.findById(noteId);
    if (!note || note.isFree) {
      return res.status(400).json({ success: false, message: 'Invalid note' });
    }

    // ✅ Check for ANY non-failed payment (completed OR pending)
    const existing = await Payment.findOne({ 
      user: userId, 
      note: noteId, 
      status: { $in: ["completed", "pending"] } // ← KEY CHANGE
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: existing.status === "completed" ? 'Already purchased' : 'Payment already in progress'
      });
    }

    const order = await razorpay.orders.create({
      amount: note.price * 100,
      currency: "INR",
      receipt: `note_${noteId}_${userId}_${Date.now()}`,
      payment_capture: 1,
    });

    // ✅ Create pending payment record IMMEDIATELY
    await Payment.create({
      user: userId,
      note: noteId,
      amount: note.price,
      razorpayOrderId: order.id,
      status: 'pending' // ← Prevents duplicate orders
    });

    return res.json({
      success: true,
      order: { ...order, key: process.env.RAZORPAY_KEY_ID },
      note: { id: note._id, title: note.title, price: note.price }
    });

  } catch (error) {
    console.error("Order creation error:", error);
    return res.status(500).json({ success: false, message: "Failed to create order" });
  }
};



// -------------------------------------------------------
// 2️⃣ VERIFY PAYMENT (IDEMPOTENT & SAFE)
// -------------------------------------------------------
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, noteId } = req.body;
    const userId = req.user._id;

    // Verify signature
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const note = await Note.findById(noteId);
    if (!note || note.isFree) {
      return res.status(400).json({ success: false, message: "Invalid note" });
    }

    // ✅ ATOMIC UPDATE - Only ONE request will succeed
    const payment = await Payment.findOneAndUpdate(
      { 
        razorpayOrderId: razorpay_order_id,
        status: 'pending' // ← Only update if still pending
      },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "completed",
          paymentDate: new Date()
        }
      },
      { new: true }
    );

    if (!payment) {
      // Either doesn't exist or already completed
      const existing = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
      
      if (!existing) {
        return res.status(404).json({ success: false, message: "Payment record not found" });
      }
      
      if (existing.status === 'completed') {
        // Already processed - return success (idempotent)
        return res.json({
          success: true,
          message: "Payment already verified",
          downloadUrl: note.fileUrl
        });
      }
    }

    return res.json({
      success: true,
      message: "Payment verified",
      downloadUrl: note.fileUrl
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Payment verification failed" 
    });
  }
};


// -------------------------------------------------------
// 3️⃣ CHECK PURCHASE
// -------------------------------------------------------
exports.checkPurchase = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findOne({
      user: userId,
      note: noteId,
      status: "completed"
    });

    return res.json({
      success: true,
      hasPurchased: !!payment
    });

  } catch (error) {
    console.error("Check purchase error:", error);
    return res.status(500).json({ success: false, message: "Failed to check purchase" });
  }
};



// -------------------------------------------------------
// 4️⃣ GET USER PURCHASE HISTORY
// -------------------------------------------------------
exports.getUserPurchases = async (req, res) => {
  try {
    const userId = req.user._id;

    const payments = await Payment.find({
      user: userId,
      status: "completed"
    })
      .populate("note", "title description price fileUrl")
      .sort({ paymentDate: -1 });

    return res.json({
      success: true,
      purchases: payments
    });

  } catch (error) {
    console.error("Fetch history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch purchases" });
  }
};
