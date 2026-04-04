const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifySchoolToken } = require('../middleware/schoolAuth');

// Public - teacher sets password via invite link
router.post('/set-password', teacherController.setPassword);

// Public - teacher login (schoolCode + email + password)
router.post('/login', teacherController.login);

// School auth required
router.get('/:id', verifySchoolToken, teacherController.getTeacherById);

module.exports = router;
