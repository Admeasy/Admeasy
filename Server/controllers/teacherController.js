const Teacher = require('../models/teacherSchema');
const School = require('../models/schoolSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { TOKEN_EXPIRY } = require('../middleware/schoolAuth');
require('dotenv').config();

// POST /api/teachers/invite - same as schools/add-teacher, kept for API spec compatibility
// (Actual invite is in schoolController.addTeacher)

// POST /api/teachers/set-password - teacher sets password via invite token
exports.setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
    }

    const teacher = await Teacher.findOne({
      inviteToken: token,
      inviteTokenExpiry: { $gt: new Date() },
    }).select('+inviteToken +inviteTokenExpiry +password');

    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invite token',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    teacher.password = hashedPassword;
    teacher.inviteToken = null;
    teacher.inviteTokenExpiry = null;
    await teacher.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: 'Password set successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Error setting teacher password:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// POST /api/teachers/login - schoolCode + email + password
exports.login = async (req, res) => {
  try {
    const { schoolCode, email, password } = req.body;

    if (!schoolCode || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'School code, email, and password are required',
      });
    }

    const code = schoolCode.trim().toUpperCase();
    const school = await School.findOne({ schoolCode: code });
    if (!school) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school code or credentials',
      });
    }

    const teacher = await Teacher.findOne({
      schoolId: school._id,
      email: email.trim().toLowerCase(),
      isActive: true,
    }).select('+password');

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school code or credentials',
      });
    }

    if (!teacher.password) {
      return res.status(400).json({
        success: false,
        message: 'Password not set. Please use the invite link to set your password.',
      });
    }

    const valid = await bcrypt.compare(password, teacher.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school code or credentials',
      });
    }

    const token = jwt.sign(
      {
        schoolId: school._id.toString(),
        teacherId: teacher._id.toString(),
        role: teacher.role === 'admin' ? 'school_admin' : 'teacher',
      },
      process.env.JWT_SCHOOL_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.cookie('schoolToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      teacher: {
        _id: teacher._id,
        email: teacher.email,
        name: teacher.name,
        role: teacher.role,
        schoolId: school._id,
        schoolName: school.schoolName,
        schoolCode: school.schoolCode,
      },
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// GET /api/teachers/:id - teacher profile (school auth)
exports.getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.schoolAuth || {};

    const teacher = await Teacher.findById(id)
      .select('-password -inviteToken -inviteTokenExpiry')
      .populate('schoolId', 'schoolName schoolCode');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    if (teacher.schoolId._id.toString() !== schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    return res.json({
      success: true,
      teacher: {
        _id: teacher._id,
        email: teacher.email,
        name: teacher.name,
        role: teacher.role,
        assignedSpaces: teacher.assignedSpaces,
        schoolId: teacher.schoolId,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
