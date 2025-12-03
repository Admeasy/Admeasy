const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const {
    requireUser,
    requireMentor,
    requireChatParticipant,
    requireUserInitiatedChat
} = require('../middleware/chatAuth');

// User routes (require user authentication)
router.get('/chats', requireUser, chatController.getUserChats);

// Create or get chat between user and mentor (user-initiated only)
router.post('/chats/:mentorId', requireUser, requireUserInitiatedChat, chatController.createOrGetChat);

// Get messages for a specific chat (user accessing mentor chat)
router.get('/chats/:mentorId/messages', requireUser, requireChatParticipant, chatController.getChatMessages);

// Send message in chat (user to mentor)
router.post('/chats/:mentorId/messages', requireUser, requireChatParticipant, chatController.sendMessage);

// Mentor routes (require mentor authentication)
router.get('/mentor/chats', requireMentor, chatController.getMentorChats);

// Get messages for a specific chat (mentor accessing user chat)
router.get('/mentor/chats/:userId/messages', requireMentor, requireChatParticipant, chatController.getChatMessages);

// Send message in chat (mentor to user)
router.post('/mentor/chats/:userId/messages', requireMentor, requireChatParticipant, chatController.sendMessage);

module.exports = router;
