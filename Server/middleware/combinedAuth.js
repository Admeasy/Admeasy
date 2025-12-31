const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');

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
        if (req.session) {
          req.session.mentorId = mentor._id;
        }
      }
    } else {
      // Default to user (or if role is 'user' or undefined)
      const user = await User.findById(decoded.id || decoded._id);
      if (user) {
        req.user = user;
        if (req.session) {
          req.session.userId = user._id;
        }
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
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    if (decoded.role === 'mentor') {
      const mentor = await Mentor.findById(decoded.id || decoded._id);
      if (!mentor) {
        return res.status(401).json({
          success: false,
          message: 'Mentor not found',
        });
      }
      req.mentor = mentor;
      if (req.session) {
        req.session.mentorId = mentor._id;
      }
      return next();
    } else {
      // Default to user
      const user = await User.findById(decoded.id || decoded._id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }
      req.user = user;
      if (req.session) {
        req.session.userId = user._id;
      }
      return next();
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

module.exports = {
  authenticateOptional,
  authenticateRequired,
};


