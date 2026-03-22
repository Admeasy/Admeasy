const School = require('../models/schoolSchema');
const Teacher = require('../models/teacherSchema');
const Space = require('../models/spaceSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { verifySchoolToken, requireSchoolAdmin, TOKEN_EXPIRY } = require('../middleware/schoolAuth');
require('dotenv').config();

// Generate unique school code: 2 letters + 5 digits
async function generateSchoolCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 100;

  while (exists && attempts < maxAttempts) {
    const L1 = letters[Math.floor(Math.random() * 26)];
    const L2 = letters[Math.floor(Math.random() * 26)];
    const num = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    code = L1 + L2 + num;
    const found = await School.findOne({ schoolCode: code });
    exists = !!found;
    attempts++;
  }

  if (exists) {
    throw new Error('Could not generate unique school code');
  }
  return code;
}

// POST /api/schools/create - admin only
exports.createSchool = async (req, res) => {
  try {
    const { schoolName, city, board, adminEmail, password, schoolCode: customCode } = req.body;

    if (!schoolName || !adminEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'School name, admin email, and password are required',
      });
    }

    const schoolCode = customCode && /^[A-Z]{2}\d{5}$/.test(customCode.trim().toUpperCase())
      ? customCode.trim().toUpperCase()
      : await generateSchoolCode();

    const existing = await School.findOne({
      $or: [{ schoolCode }, { adminEmail: adminEmail.toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.schoolCode === schoolCode
          ? 'School code already exists'
          : 'Admin email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const school = new School({
      schoolCode,
      schoolName: schoolName.trim(),
      city: (city || '').trim(),
      board: (board || '').trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      password: hashedPassword,
    });
    await school.save();

    // Create admin teacher (school admin is also a teacher with role admin)
    const adminTeacher = new Teacher({
      schoolId: school._id,
      email: adminEmail.trim().toLowerCase(),
      name: 'School Admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
    await adminTeacher.save();

    // Create default School Hub + Class spaces
    await exports.createDefaultSchoolSpaces(school._id, adminTeacher._id);

    return res.status(201).json({
      success: true,
      message: 'School created successfully',
      school: {
        _id: school._id,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        city: school.city,
        board: school.board,
        adminEmail: school.adminEmail,
        createdAt: school.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating school:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// POST /api/schools/login - schoolCode + password
exports.login = async (req, res) => {
  try {
    const { schoolCode, password } = req.body;

    if (!schoolCode || !password) {
      return res.status(400).json({
        success: false,
        message: 'School code and password are required',
      });
    }

    const code = schoolCode.trim().toUpperCase();
    const school = await School.findOne({ schoolCode: code }).select('+password');
    if (!school) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school code or password',
      });
    }

    const valid = await bcrypt.compare(password, school.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school code or password',
      });
    }

    const token = jwt.sign(
      {
        schoolId: school._id.toString(),
        role: 'school_admin',
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
      school: {
        _id: school._id,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        city: school.city,
        board: school.board,
        adminEmail: school.adminEmail,
      },
    });
  } catch (error) {
    console.error('School login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// GET /api/schools/me - current school (school token required)
exports.getMe = async (req, res) => {
  try {
    const { schoolId, teacherId, role } = req.schoolAuth || {};
    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'School login required' });
    }

    const school = await School.findById(schoolId).select('-password').lean();
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    let teacher = null;
    if (teacherId) {
      const T = await Teacher.findById(teacherId).select('-password -inviteToken -inviteTokenExpiry').lean();
      teacher = T;
    }

    return res.json({
      success: true,
      school: {
        _id: school._id,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        city: school.city,
        board: school.board,
        adminEmail: school.adminEmail,
      },
      role,
      teacher: teacher ? { _id: teacher._id, email: teacher.email, name: teacher.name, assignedSpaces: teacher.assignedSpaces } : null,
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// POST /api/schools/add-teacher - school admin only
exports.addTeacher = async (req, res) => {
  try {
    const { schoolId } = req.schoolAuth;
    const { email, name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Teacher email is required',
      });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Teacher.findOne({ schoolId, email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Teacher with this email already exists in this school',
      });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const teacher = new Teacher({
      schoolId,
      email: normalizedEmail,
      name: (name || '').trim(),
      inviteToken,
      inviteTokenExpiry,
      role: 'teacher',
    });
    await teacher.save();

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/school/teacher/set-password?token=${inviteToken}`;

    return res.status(201).json({
      success: true,
      message: 'Teacher added. Share the invite link manually.',
      teacher: {
        _id: teacher._id,
        email: teacher.email,
        name: teacher.name,
        role: teacher.role,
        inviteLink,
      },
    });
  } catch (error) {
    console.error('Error adding teacher:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// GET /api/schools/:id - school details (school auth or admin)
exports.getSchoolById = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const schoolAuth = req.schoolAuth;
    const isAdmin = req.admin;

    const school = await School.findById(schoolId).select('-password');
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    if (!schoolAuth && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (schoolAuth && schoolAuth.schoolId !== schoolId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this school',
      });
    }

    return res.json({
      success: true,
      school: {
        _id: school._id,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        city: school.city,
        board: school.board,
        adminEmail: school.adminEmail,
        createdAt: school.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// Helper: create School Hub + Class spaces for a new school
exports.createDefaultSchoolSpaces = async (schoolId, adminTeacherId) => {
  const school = await School.findById(schoolId).select('schoolName');
  if (!school) return [];

  const creatorSnapshot = {
    id: adminTeacherId,
    role: 'teacher',
    username: null,
    name: school.schoolName + ' Admin',
    image: null,
    joinedAt: new Date(),
  };

  const spacesToCreate = [
    { name: 'School Hub', description: 'Main hub for ' + school.schoolName },
    { name: 'Class 9', description: 'Class 9 space' },
    { name: 'Class 10', description: 'Class 10 space' },
    { name: 'Class 11', description: 'Class 11 space' },
    { name: 'Class 12', description: 'Class 12 space' },
  ];

  const created = [];
  for (const s of spacesToCreate) {
    const space = new Space({
      name: s.name,
      description: s.description,
      type: 'school',
      schoolId,
      isJoinApprovalRequired: true,
      isPostingRestricted: false,
      creator: creatorSnapshot,
      members: adminTeacherId ? [creatorSnapshot] : [],
      moderators: adminTeacherId ? [adminTeacherId] : [],
    });
    await space.save();
    created.push(space);
  }
  return created;
};
