const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { verifyAdminToken } = require('../middleware/adminAuth');
const { verifySchoolToken, requireSchoolAdmin } = require('../middleware/schoolAuth');

// Public
router.post('/login', schoolController.login);

// School auth - get current school/teacher
router.get('/me', verifySchoolToken, schoolController.getMe);

// Admin only
router.post('/create', verifyAdminToken, schoolController.createSchool);

// School auth OR Admin auth - try school first, then admin
const verifySchoolOrAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const schoolToken = req.cookies?.schoolToken || bearer;
  const adminToken = req.cookies?.adminToken || bearer;

  const jwt = require('jsonwebtoken');

  if (schoolToken && process.env.JWT_SCHOOL_SECRET) {
    try {
      const decoded = jwt.verify(schoolToken, process.env.JWT_SCHOOL_SECRET);
      if (decoded.schoolId) {
        req.schoolAuth = { schoolId: decoded.schoolId, teacherId: decoded.teacherId, role: decoded.role };
        return next();
      }
    } catch (e) {
      // fall through to admin
    }
  }

  if (adminToken && process.env.JWT_ADMIN_SECRET) {
    try {
      const decoded = jwt.verify(adminToken, process.env.JWT_ADMIN_SECRET);
      if (decoded.role === 'admin') {
        req.admin = { _id: decoded._id, username: decoded.username, role: decoded.role };
        return next();
      }
    } catch (e) {
      // fall through
    }
  }

  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

router.get('/:id', verifySchoolOrAdmin, schoolController.getSchoolById);

// School admin only
router.post('/add-teacher', verifySchoolToken, requireSchoolAdmin, schoolController.addTeacher);

module.exports = router;
