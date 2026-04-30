const express = require('express');
const router = express.Router();
const { summarizeNote, chatNote } = require('../controllers/aiController');
// Assuming you have authenticateToken middleware if you want to protect the route
// const { authenticateToken } = require('../middleware/authMiddleware');

// For now, making it unprotected or you can add authenticateToken if needed.
// Based on requirement: "Secure APIs with existing auth middleware"
const { authenticateRequired } = require('../middleware/combinedAuth');

router.post('/summarize-note', authenticateRequired, summarizeNote);
router.post('/chat-note', authenticateRequired, chatNote);

module.exports = router;
