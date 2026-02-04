const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateRequired } = require('../middleware/combinedAuth');
const { 
    requireUserToMentorChatParticipant, 
    requireUserInitiatedUserToMentorChat,
    requireUserToUserChatParticipant,
    requireMentorToMentorChatParticipant
} = require('../middleware/chatAuth');

// User routes (require user authentication - using authenticateRequired which doesn't require email verification/onboarding)
router.get('/chats', authenticateRequired, chatController.getUserChats);

// Create or get chat between user and mentor (user-initiated only)
router.post('/chats/:mentorId', authenticateRequired, requireUserInitiatedUserToMentorChat, chatController.createOrGetUserToMentorChat);

// Get messages for a specific user-to-mentor chat (user accessing mentor chat)
router.get('/chats/:mentorId/messages', authenticateRequired, requireUserToMentorChatParticipant, chatController.getUserToMentorChatMessages);

// Send message in user-to-mentor chat (user to mentor)
router.post('/chats/:mentorId/messages', authenticateRequired, requireUserToMentorChatParticipant, chatController.sendUserToMentorMessage);

// Mentor routes (require mentor authentication - using authenticateRequired)
router.get('/mentor/chats', authenticateRequired, chatController.getMentorChats);

// Get or access existing chat between mentor and user (mentor accessing user chat)
router.post('/mentor/chats/:userId', authenticateRequired, chatController.getMentorToUserChat);

// Get messages for a specific user-to-mentor chat (mentor accessing user chat)
router.get('/mentor/chats/:userId/messages', authenticateRequired, requireUserToMentorChatParticipant, chatController.getUserToMentorChatMessages);

// Send message in user-to-mentor chat (mentor to user)
router.post('/mentor/chats/:userId/messages', authenticateRequired, requireUserToMentorChatParticipant, chatController.sendUserToMentorMessage);

// ========== USER-TO-USER CHAT ROUTES ==========
// Get user's user-to-user chat inbox
router.get('/user-chats', authenticateRequired, chatController.getUserToUserChats);

// Create or get chat between two users
router.post('/user-chats/:userId', authenticateRequired, chatController.createOrGetUserToUserChat);

// Get messages for a user-to-user chat
router.get('/user-chats/:userId/messages', authenticateRequired, requireUserToUserChatParticipant, chatController.getUserToUserChatMessages);

// Send message in user-to-user chat
router.post('/user-chats/:userId/messages', authenticateRequired, requireUserToUserChatParticipant, chatController.sendUserToUserMessage);

// ========== MENTOR-TO-MENTOR CHAT ROUTES ==========
// Get mentor's mentor-to-mentor chat inbox
router.get('/mentor/mentor-chats', authenticateRequired, chatController.getMentorToMentorChats);

// Create or get chat between two mentors
router.post('/mentor/mentor-chats/:mentorId', authenticateRequired, chatController.createOrGetMentorToMentorChat);

// Get messages for a mentor-to-mentor chat
router.get('/mentor/mentor-chats/:mentorId/messages', authenticateRequired, requireMentorToMentorChatParticipant, chatController.getMentorToMentorChatMessages);

// Send message in mentor-to-mentor chat
router.post('/mentor/mentor-chats/:mentorId/messages', authenticateRequired, requireMentorToMentorChatParticipant, chatController.sendMentorToMentorMessage);

module.exports = router;
