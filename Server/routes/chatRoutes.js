const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateJWT = require('../middleware/userAuth');
const authenticateMentorJWT = require('../middleware/mentorAuth');
const { requireChatParticipant, requireUserInitiatedChat } = require('../middleware/chatAuth');

// User routes (require user authentication)
router.get('/chats', authenticateJWT, chatController.getUserChats);

// Create or get chat between user and mentor (user-initiated only)
router.post('/chats/:mentorId', authenticateJWT, requireUserInitiatedChat, chatController.createOrGetChat);

// Get messages for a specific chat (user accessing mentor chat)
router.get('/chats/:mentorId/messages', authenticateJWT, requireChatParticipant, chatController.getChatMessages);

// Send message in chat (user to mentor)
router.post('/chats/:mentorId/messages', authenticateJWT, requireChatParticipant, chatController.sendMessage);

// Mentor routes (require mentor authentication)
router.get('/mentor/chats', authenticateMentorJWT, chatController.getMentorChats);

// Get messages for a specific chat (mentor accessing user chat)
router.get('/mentor/chats/:userId/messages', authenticateMentorJWT, requireChatParticipant, chatController.getChatMessages);

// Send message in chat (mentor to user)
router.post('/mentor/chats/:userId/messages', authenticateMentorJWT, requireChatParticipant, chatController.sendMessage);

module.exports = router;
