const router = require("express").Router();
const {
  createOrder,
  verifyPayment,
  checkPurchase,
  getUserPurchases,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getAllPayments,
} = require("../controllers/paymentController");
const { authenticateRequired } = require("../middleware/combinedAuth");
const { verifyAdminToken } = require("../middleware/adminAuth");

// All payment routes require user authentication
router.use(authenticateRequired);

// Create Razorpay order
router.post("/create-order", createOrder);

// Verify payment after completion
router.post("/verify", verifyPayment);

// Check if user has purchased a specific note
router.get("/check/:noteId", checkPurchase);

// Get user's purchase history
router.get("/history", getUserPurchases);

// Create subscription order
router.post("/create-subscription-order", createSubscriptionOrder);

// Verify subscription payment
router.post("/verify-subscription", verifySubscriptionPayment);

// Get all payments (admin only)
router.get("/all", verifyAdminToken, getAllPayments);

module.exports = router;
