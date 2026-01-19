const express = require('express');
const router = express.Router();
const Subscription = require('../models/subscriptionSchema');
const authenticateJWT = require('../middleware/userAuth');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Get user's subscriptions
router.get('/my-subscriptions', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const subscriptions = await Subscription.find({ user: userId })
      .populate('mentor', 'name username image')
      .populate('plan', 'name features')
      .populate('payment', 'amount razorpayPaymentId paymentDate status')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

// Get all subscriptions (admin only)
router.get('/all', verifyAdminToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('user', 'name email username')
      .populate('mentor', 'name username email')
      .populate('plan', 'name')
      .populate('payment', 'amount razorpayPaymentId razorpayOrderId paymentDate status')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

// Check if user is subscribed to a mentor
router.get('/check/:mentorId', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const { mentorId } = req.params;
    
    const subscription = await Subscription.findOne({
      user: userId,
      mentor: mentorId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    res.json({ 
      success: true, 
      isSubscribed: !!subscription,
      subscription: subscription || null
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to check subscription' });
  }
});

module.exports = router;
