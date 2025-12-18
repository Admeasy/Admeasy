const Chat = require('../models/chatSchema');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');

// Middleware to check if user is authenticated and is a user (not mentor)
const requireUser = async (req, res, next) => {
    try {
        // Check if user is authenticated via session
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify user exists
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('User authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Middleware to check if mentor is authenticated
const requireMentor = async (req, res, next) => {
    try {
        // Check if mentor is authenticated via session
        if (!req.session || !req.session.mentorId) {
            return res.status(401).json({
                success: false,
                message: 'Mentor authentication required'
            });
        }

        // Verify mentor exists
        const mentor = await Mentor.findById(req.session.mentorId);
        if (!mentor) {
            return res.status(401).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        req.mentor = mentor;
        next();
    } catch (error) {
        console.error('Mentor authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Middleware to check if user can access/modify this chat
const requireChatParticipant = async (req, res, next) => {
    try {
        const { mentorId, userId } = req.params;
        const chatId = req.params.chatId;
        // Only use mentorId/userId as chatId if chatId is not explicitly provided
        const potentialChatId = chatId || req.params.mentorId || req.params.userId;

        let chat;

        // If we have both mentorId and userId params, find by participants
        if (mentorId && userId) {
            // This is for mentor accessing user chat or vice versa
            if (req.mentor) {
                // Mentor accessing user chat
                chat = await Chat.findOne({
                    mentorId: req.mentor.id,
                    userId: userId,
                    isActive: true
                });
            } else if (req.user) {
                // User accessing mentor chat
                chat = await Chat.findOne({
                    userId: req.user.id,
                    mentorId: mentorId,
                    isActive: true
                });
            }
        } else if (mentorId && req.user) {
            // Route like /api/chats/:mentorId/messages - find chat by user and mentor
            chat = await Chat.findOne({
                userId: req.user.id,
                mentorId: mentorId,
                isActive: true
            });
        } else if (userId && req.mentor) {
            // Route like /api/mentor/chats/:userId/messages - find chat by mentor and user
            chat = await Chat.findOne({
                mentorId: req.mentor.id,
                userId: userId,
                isActive: true
            });
        } else if (chatId) {
            // Direct chat ID access
            chat = await Chat.findOne({
                _id: chatId,
                isActive: true
            });

            if (chat) {
                // Verify current user/mentor is participant
                const isParticipant = req.user
                    ? chat.userId.toString() === req.user.id.toString()
                    : req.mentor
                        ? chat.mentorId.toString() === req.mentor.id.toString()
                        : false;

                if (!isParticipant) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied: Not a participant in this chat'
                    });
                }
            }
        }

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found or inactive'
            });
        }

        req.chat = chat;
        next();
    } catch (error) {
        console.error('Chat participant verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Chat verification error'
        });
    }
};

// Middleware to ensure chat creation is only allowed for users
const requireUserInitiatedChat = (req, res, next) => {
    // Only users can initiate chats - enforced by requiring user auth
    // and ensuring mentorId is provided in params
    if (!req.user) {
        return res.status(403).json({
            success: false,
            message: 'Only users can initiate chats'
        });
    }

    if (!req.params.mentorId) {
        return res.status(400).json({
            success: false,
            message: 'Mentor ID required to start chat'
        });
    }

    next();
};

module.exports = {
    requireUser,
    requireMentor,
    requireChatParticipant,
    requireUserInitiatedChat
};
