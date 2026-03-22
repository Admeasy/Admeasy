const express = require('express');
const router = express.Router();
const {
  createSpace,
  getMySpaces,
  getSuggestedSpaces,
  getAllPublicSpaces,
  getSpaceById,
  joinSpace,
  leaveSpace,
  createMessage,
  toggleLikeMessage,
  deleteSpace,
  getAllSpacesAdmin,
  deleteMessage,
  getSpaceRequests,
  approveRequest,
} = require('../controllers/spaceController');
const { authenticateRequired, authenticateOptional, authenticateUserMentorOrTeacher } = require('../middleware/combinedAuth');
const upload = require('../middleware/multer');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Create a new space (with optional logo upload)
router.post('/', authenticateRequired, upload.single('logo'), createSpace);

// Spaces the current user/mentor is a member of
router.get('/', authenticateRequired, getMySpaces);

// Suggested spaces to discover (optional auth)
router.get('/discover', authenticateOptional, getSuggestedSpaces);

// All public spaces to explore (optional auth, includes spaces user is already a member of)
router.get('/explore', authenticateOptional, getAllPublicSpaces);

// ================= ADMIN ROUTES =================

// Admin: list all spaces
router.get('/admin', verifyAdminToken, getAllSpacesAdmin);

// Admin: delete any space
router.delete('/admin/:id', verifyAdminToken, deleteSpace);

// ================= PUBLIC / MEMBER ROUTES =================

// Get a single space (public)
router.get('/:id', authenticateOptional, getSpaceById);

// Join / Leave
router.post('/:id/join', authenticateRequired, joinSpace);
router.post('/:id/leave', authenticateRequired, leaveSpace);

// Space requests (join approval flow)
router.get('/:spaceId/requests', authenticateUserMentorOrTeacher, getSpaceRequests);
router.post('/approve', authenticateUserMentorOrTeacher, approveRequest);

// Delete a space (creator only)
router.delete('/:id', authenticateRequired, deleteSpace);

// Messages
router.post(
  '/:id/messages',
  authenticateRequired,
  upload.single('image'),
  createMessage
);

router.post(
  '/:spaceId/messages/:messageId/like',
  authenticateRequired,
  toggleLikeMessage
);

router.delete(
  '/:spaceId/messages/:messageId',
  authenticateRequired,
  deleteMessage
);

module.exports = router;

