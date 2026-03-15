const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');

/**
 * Authenticate as either User/Mentor (accessToken) OR Admin (adminToken).
 * Use for routes that allow both regular users (self-actions) and admin (all actions).
 * Sets req.user or req.mentor for regular auth; sets req.admin and req.user (synthetic) for admin auth.
 */
const authenticateUserOrAdmin = async (req, res, next) => {
  // 1. Try admin token (cookie or Authorization Bearer)
  let adminToken = req.cookies?.adminToken;
  if (!adminToken && req.headers.authorization?.startsWith('Bearer ')) {
    adminToken = req.headers.authorization.split(' ')[1];
  }
  if (adminToken && process.env.JWT_ADMIN_SECRET) {
    try {
      const decoded = jwt.verify(adminToken, process.env.JWT_ADMIN_SECRET);
      req.admin = {
        _id: decoded._id,
        username: decoded.username,
        role: decoded.role
      };
      req.user = { _id: 'admin', role: 'ADMIN' }; // Synthetic user for requireSelfOrAdmin
      return next();
    } catch (err) {
      // Admin token invalid/expired, fall through to user auth
    }
  }

  // 2. Fall through to user/mentor auth
  return authenticateRequired(req, res, next);
};

/**
 * Optional authentication middleware
 * Tries to authenticate as User or Mentor, but allows unauthenticated access
 * Sets req.user or req.mentor if authenticated
 */
const authenticateOptional = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    // No token, continue without auth
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Check role and authenticate accordingly
    if (decoded.role === 'mentor') {
      const mentor = await Mentor.findById(decoded.id || decoded._id);
      if (mentor) {
        req.mentor = mentor;
      }
    } else {
      // Default to user (or if role is 'user' or undefined)
      const user = await User.findById(decoded.id || decoded._id);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Token invalid/expired, continue without auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};

/**
 * Required authentication middleware
 * Requires either User or Mentor authentication
 * Returns 401 if not authenticated
 */
const authenticateRequired = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    console.log('authenticateRequired - No token found');
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log('authenticateRequired - Decoded token role:', decoded.role, 'id:', decoded.id || decoded._id);

    if (decoded.role === 'mentor') {
      const mentor = await Mentor.findById(decoded.id || decoded._id);
      if (!mentor) {
        console.log('authenticateRequired - Mentor not found for ID:', decoded.id || decoded._id);
        return res.status(401).json({
          success: false,
          message: 'Mentor not found',
        });
      }
      req.mentor = mentor;
      console.log('authenticateRequired - Set req.mentor');
      return next();
    } else if (decoded.role === 'user') {
      // Default to user
      const user = await User.findById(decoded.id || decoded._id);
      if (!user) {
        console.log('authenticateRequired - User not found for ID:', decoded.id || decoded._id);
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }
      req.user = user;
      console.log('authenticateRequired - Set req.user, userId:', user._id);
      return next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  } catch (error) {
    console.error('authenticateRequired - Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
// Should be admin or owner of account to delete the account
const requireSelfOrAdmin = (req, res, next) => {
  // Admin token grants full access
  if (req.admin) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const isOwner = req.user._id && req.user._id.toString() === req.params.userId;
  const isAdmin = req.user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to delete this account'
    });
  }

  next();
};

module.exports = {
  authenticateOptional,
  authenticateRequired,
  authenticateUserOrAdmin,
  requireSelfOrAdmin,
};


