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
  deleteNote,
  proxyPdf
} = require('../controllers/noteController');
const { authenticateRequired } = require('../middleware/combinedAuth');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size must be less than 10MB' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: err.message || 'File upload error' 
    });
  }
  if (err) {
    return res.status(400).json({ 
      success: false, 
      message: err.message || 'File upload error' 
    });
  }
  next();
};

// Public routes
router.get('/', getNotes);
router.get('/:id/pdf', proxyPdf); // PDF proxy route with proper headers (must be before /:id)
router.get('/:id', getNoteById);
router.post('/:id/like', likeNote);
router.post('/:id/view', viewNote);

// Mentor routes
router.post('/', authenticateRequired, upload.single('noteFile'), handleMulterError, uploadNote);

// Admin routes
router.get('/admin/all', verifyAdminToken, getAllNotes);
router.put('/admin/:id', verifyAdminToken, updateNote);
router.delete('/admin/:id', verifyAdminToken, deleteNote);

module.exports = router;