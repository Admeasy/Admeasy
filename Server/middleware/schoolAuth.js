const jwt = require('jsonwebtoken');
require('dotenv').config();

const TOKEN_EXPIRY = '12h';

/**
 * School/Teacher JWT - separate from admin and user/mentor.
 * Payload: { schoolId, teacherId?, role: 'school_admin'|'teacher' }
 */

function getSchoolToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return req.cookies?.schoolToken || null;
}

/**
 * Verify school or teacher token.
 * Sets req.schoolAuth = { schoolId, teacherId?, role: 'school_admin'|'teacher' }
 */
const verifySchoolToken = (req, res, next) => {
  try {
    const token = getSchoolToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - School login required',
      });
    }

    if (!process.env.JWT_SCHOOL_SECRET) {
      console.error('[SchoolAuth] JWT_SCHOOL_SECRET not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SCHOOL_SECRET);

    if (!decoded.schoolId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school token',
      });
    }

    req.schoolAuth = {
      schoolId: decoded.schoolId,
      teacherId: decoded.teacherId || null,
      role: decoded.role || 'teacher',
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired - Please log in again',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid token',
    });
  }
};

/**
 * Require school admin role (not just teacher).
 */
const requireSchoolAdmin = (req, res, next) => {
  if (req.schoolAuth?.role !== 'school_admin') {
    return res.status(403).json({
      success: false,
      message: 'School admin access required',
    });
  }
  next();
};

module.exports = {
  getSchoolToken,
  verifySchoolToken,
  requireSchoolAdmin,
  TOKEN_EXPIRY,
};
