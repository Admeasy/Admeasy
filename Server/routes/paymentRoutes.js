const router = require('express').Router();
const {
  createOrder,
  verifyPayment,
  checkPurchase,
  getUserPurchases
} = require('../controllers/paymentController');
const authenticateJWT = require('../middleware/userAuth');

// All payment routes require user authentication
router.use(authenticateJWT);

// Create Razorpay order
router.post('/create-order', createOrder);

// Verify payment after completion
router.post('/verify', verifyPayment);

// Check if user has purchased a specific note
router.get('/check/:noteId', checkPurchase);

// Get user's purchase history
router.get('/history', getUserPurchases);

module.exports = router;
