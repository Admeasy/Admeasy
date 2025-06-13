const express = require('express');
const router = express.Router();
const { adminAuth, verifyAdminToken } = require('../middleware/adminAuth');

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

module.exports = router; 