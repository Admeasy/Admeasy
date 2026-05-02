const express = require('express');
const router = express.Router();
const { summarizeNote, chatNote } = require('../controllers/aiController');
const { authenticateRequired } = require('../middleware/combinedAuth');

router.post('/summarize-note', authenticateRequired, summarizeNote);
router.post('/chat-note', authenticateRequired, chatNote);

module.exports = router;
