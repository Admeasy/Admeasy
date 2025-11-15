const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminAuth = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Check if environment variables are set
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_ADMIN_SECRET) {
      console.error('Missing environment variables:');
      console.error('- ADMIN_USERNAME:', !!process.env.ADMIN_USERNAME);
      console.error('- ADMIN_PASSWORD:', !!process.env.ADMIN_PASSWORD);
      console.error('- JWT_ADMIN_SECRET:', !!process.env.JWT_ADMIN_SECRET);

      return res.status(500).json({
        success: false,
        message: 'Server configuration error - Missing environment variables'
      });
    }

    // Check if credentials match environment variables
    const isUsernameMatch = username === process.env.ADMIN_USERNAME;
    const isPasswordMatch = password === process.env.ADMIN_PASSWORD;

    // Validate credentials
    if (isUsernameMatch && isPasswordMatch) {
      // Create JWT token with admin ID
      const token = jwt.sign(
        { 
          _id: 'admin-' + Date.now(), // Generate a unique ID for this admin session
          username, 
          role: 'admin' 
        },
        process.env.JWT_ADMIN_SECRET,
        { expiresIn: '12h' } // Extended to 12 hours
      );

      // Set HTTP-only cookie
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000 // 12 hours
      });

      // Authentication successful
      return res.json({
        success: true,
        message: 'Authentication successful'
      });
    }

    // Authentication failed
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Middleware to verify admin token for protected routes
const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.cookies.adminToken;

    console.log('=== VERIFY ADMIN TOKEN ===');
    console.log('Token exists:', !!token);
    console.log('Cookies:', req.cookies);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided - Please login again'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    console.log('Decoded token:', decoded);
    
    // Set admin info on request
    req.admin = {
      _id: decoded._id,
      username: decoded.username,
      role: decoded.role
    };
    console.log('Admin authenticated:', req.admin.username);
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token - Please login again'
    });
  }
};

module.exports = { adminAuth, verifyAdminToken };