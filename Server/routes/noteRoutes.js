const router = require('express').Router();
const multer = require('multer');
const {
  getNotes,
  getNoteById,
  likeNote,
  viewNote,
  uploadNote,
  getAllNotes,
  updateNote,
  deleteNote
} = require('../controllers/noteController');
const authenticateMentorJWT = require('../middleware/mentorAuth');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Public routes
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/:id/like', likeNote);
router.post('/:id/view', viewNote);

// Mentor routes
router.post('/', authenticateMentorJWT, upload.single('noteFile'), uploadNote);

// Admin routes
router.get('/admin/all', verifyAdminToken, getAllNotes);
router.put('/admin/:id', verifyAdminToken, updateNote);
router.delete('/admin/:id', verifyAdminToken, deleteNote);

module.exports = router;

