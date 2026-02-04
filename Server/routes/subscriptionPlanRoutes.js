const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/subscriptionPlanSchema');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Get all subscription plans (public)
router.get('/', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all subscription plans (admin only - for management)
router.get('/admin', verifyAdminToken, async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create new subscription plan (admin only)
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { name, price, originalPrice, features } = req.body;

    // Validate required fields
    if (!name || !price || !originalPrice || !features || !Array.isArray(features)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate price structure
    if (!price.monthly || !price.yearly || !originalPrice.monthly || !originalPrice.yearly) {
      return res.status(400).json({ error: 'Price and originalPrice must have both monthly and yearly values' });
    }

    const plan = new SubscriptionPlan({
      name,
      price: {
        monthly: Number(price.monthly),
        yearly: Number(price.yearly)
      },
      originalPrice: {
        monthly: Number(originalPrice.monthly),
        yearly: Number(originalPrice.yearly)
      },
      features: Array.isArray(features) ? features : []
    });

    await plan.save();
    res.json({ message: 'Subscription plan created successfully', plan });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update subscription plan (admin only)
router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, originalPrice, features } = req.body;

    // Validate required fields
    if (!name || !price || !originalPrice || !features || !Array.isArray(features)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate price structure
    if (!price.monthly || !price.yearly || !originalPrice.monthly || !originalPrice.yearly) {
      return res.status(400).json({ error: 'Price and originalPrice must have both monthly and yearly values' });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      {
        name,
        price: {
          monthly: Number(price.monthly),
          yearly: Number(price.yearly)
        },
        originalPrice: {
          monthly: Number(originalPrice.monthly),
          yearly: Number(originalPrice.yearly)
        },
        features: Array.isArray(features) ? features : []
      },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    res.json({ message: 'Subscription plan updated successfully', plan });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete subscription plan (admin only)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
