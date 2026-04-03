const jwt = require('jsonwebtoken');
require('dotenv').config();

const TOKEN_EXPIRY = '12h';
const COOKIE_MAX_AGE = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Get admin JWT from request: Authorization Bearer header (production-friendly) or cookie.
 */
function getAdminToken(req) {
  const authHeader = req.header('Authorization');
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Better than split
  }
  return req.cookies?.adminToken || null;
}

const adminAuth = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_ADMIN_SECRET) {
      console.error('[AdminAuth] Missing env: ADMIN_USERNAME, ADMIN_PASSWORD, or JWT_ADMIN_SECRET');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error - Missing environment variables'
      });
    }

    const isUsernameMatch = username === process.env.ADMIN_USERNAME;
    const isPasswordMatch = password === process.env.ADMIN_PASSWORD;

    if (isUsernameMatch && isPasswordMatch) {
      const token = jwt.sign(
        {
          _id: 'admin-' + Date.now(),
          username,
          role: 'admin'
        },
        process.env.JWT_ADMIN_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
        maxAge: COOKIE_MAX_AGE
      });

      return res.json({
        success: true,
        message: 'Authentication successful',
        token // Frontend can send this as Authorization: Bearer <token> in production
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  } catch (error) {
    console.error('[AdminAuth] Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Verify admin token for protected routes.
 * Accepts token from: Authorization: Bearer <token> OR cookie adminToken.
 */
const verifyAdminToken = (req, res, next) => {
  try {
    const token = getAdminToken(req);

    if (!token) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[AdminAuth] 401: No token (header or cookie)');
      }
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid or missing token. Please log in again.'
      });
    }

    if (!process.env.JWT_ADMIN_SECRET) {
      console.error('[AdminAuth] JWT_ADMIN_SECRET not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    if (decoded.role !== 'admin') {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[AdminAuth] 403: Invalid role', decoded.role);
      }
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.admin = {
      _id: decoded._id,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    const isInvalid = error.name === 'JsonWebTokenError';
    if (process.env.NODE_ENV === 'production') {
      console.warn('[AdminAuth] Token error:', error.message);
    }
    return res.status(401).json({
      success: false,
      message: isExpired
        ? 'Session expired - Please log in again.'
        : isInvalid
          ? 'Unauthorized - Invalid or missing token. Please log in again.'
          : 'Unauthorized - Please log in again.'
    });
  }
};

module.exports = { adminAuth, verifyAdminToken, getAdminToken };