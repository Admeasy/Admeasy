const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminAuth = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Check if environment variables are set
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
      console.error('Missing environment variables:');
      console.error('- ADMIN_USERNAME:', !!process.env.ADMIN_USERNAME);
      console.error('- ADMIN_PASSWORD:', !!process.env.ADMIN_PASSWORD);
      console.error('- JWT_SECRET:', !!process.env.JWT_SECRET);
      
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
      // Create authentication token
      
      // Create JWT token
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set HTTP-only cookie
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000 // 1 hour
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
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

module.exports = { adminAuth, verifyAdminToken };