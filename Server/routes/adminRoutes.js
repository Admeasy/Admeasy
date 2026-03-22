const express = require('express');
const router = express.Router();
const { adminAuth, verifyAdminToken } = require('../middleware/adminAuth');
const School = require('../models/schoolSchema');

// Admin login route
router.post('/login', adminAuth);

// Protected admin routes
router.get('/verify', verifyAdminToken, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ================= SCHOOLS (Admin only) =================
router.get('/schools', verifyAdminToken, async (req, res) => {
  try {
    const schools = await School.find().select('-password').sort({ createdAt: -1 }).lean();
    return res.json({ success: true, schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router; 