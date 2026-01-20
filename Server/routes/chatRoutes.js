const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateJWT = require('../middleware/userAuth');
const authenticateMentorJWT = require('../middleware/mentorAuth');
const { 
    requireUserToMentorChatParticipant, 
    requireUserInitiatedUserToMentorChat,
    requireUserToUserChatParticipant,
    requireMentorToMentorChatParticipant
} = require('../middleware/chatAuth');

// User routes (require user authentication)
router.get('/chats', authenticateJWT, chatController.getUserChats);

// Create or get chat between user and mentor (user-initiated only)
router.post('/chats/:mentorId', authenticateJWT, requireUserInitiatedUserToMentorChat, chatController.createOrGetUserToMentorChat);

// Get messages for a specific user-to-mentor chat (user accessing mentor chat)
router.get('/chats/:mentorId/messages', authenticateJWT, requireUserToMentorChatParticipant, chatController.getUserToMentorChatMessages);

// Send message in user-to-mentor chat (user to mentor)
router.post('/chats/:mentorId/messages', authenticateJWT, requireUserToMentorChatParticipant, chatController.sendUserToMentorMessage);

// Mentor routes (require mentor authentication)
router.get('/mentor/chats', authenticateMentorJWT, chatController.getMentorChats);

// Get messages for a specific user-to-mentor chat (mentor accessing user chat)
router.get('/mentor/chats/:userId/messages', authenticateMentorJWT, requireUserToMentorChatParticipant, chatController.getUserToMentorChatMessages);

// Send message in user-to-mentor chat (mentor to user)
router.post('/mentor/chats/:userId/messages', authenticateMentorJWT, requireUserToMentorChatParticipant, chatController.sendUserToMentorMessage);

// ========== USER-TO-USER CHAT ROUTES ==========
// Get user's user-to-user chat inbox
router.get('/user-chats', authenticateJWT, chatController.getUserToUserChats);

// Create or get chat between two users
router.post('/user-chats/:userId', authenticateJWT, chatController.createOrGetUserToUserChat);

// Get messages for a user-to-user chat
router.get('/user-chats/:userId/messages', authenticateJWT, requireUserToUserChatParticipant, chatController.getUserToUserChatMessages);

// Send message in user-to-user chat
router.post('/user-chats/:userId/messages', authenticateJWT, requireUserToUserChatParticipant, chatController.sendUserToUserMessage);

// ========== MENTOR-TO-MENTOR CHAT ROUTES ==========
// Get mentor's mentor-to-mentor chat inbox
router.get('/mentor/mentor-chats', authenticateMentorJWT, chatController.getMentorToMentorChats);

// Create or get chat between two mentors
router.post('/mentor/mentor-chats/:mentorId', authenticateMentorJWT, chatController.createOrGetMentorToMentorChat);

// Get messages for a mentor-to-mentor chat
router.get('/mentor/mentor-chats/:mentorId/messages', authenticateMentorJWT, requireMentorToMentorChatParticipant, chatController.getMentorToMentorChatMessages);

// Send message in mentor-to-mentor chat
router.post('/mentor/mentor-chats/:mentorId/messages', authenticateMentorJWT, requireMentorToMentorChatParticipant, chatController.sendMentorToMentorMessage);

module.exports = router;
