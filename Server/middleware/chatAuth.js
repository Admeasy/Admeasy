const UserToMentorChat = require('../models/userToMentorChatSchema');
const UserToUserChat = require('../models/userToUserChatSchema');
const MentorToMentorChat = require('../models/mentorToMentorChatSchema');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to check if user is authenticated and is a user (not mentor)
// Uses JWT authentication instead of session-based
const requireUser = async (req, res, next) => {
    try {
        // Check for JWT token in cookies
        const token = req.cookies?.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            
            // Check if this token is for a user (not a mentor)
            if (decoded.role && decoded.role === 'mentor') {
                return res.status(403).json({
                    success: false,
                    message: 'Mentor token not valid for user routes'
                });
            }

            // Verify user exists
            const user = await User.findById(decoded.id || decoded._id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = user;
            next();
        } catch (jwtErr) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        console.error('User authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Middleware to check if mentor is authenticated
// Uses JWT authentication instead of session-based
const requireMentor = async (req, res, next) => {
    try {
        // Check for JWT token in cookies
        const token = req.cookies?.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Mentor authentication required'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            
            // Check if this token is for a mentor (not a user)
            if (decoded.role && decoded.role === 'user') {
                return res.status(403).json({
                    success: false,
                    message: 'User token not valid for mentor routes'
                });
            }

            // Verify mentor exists
            const mentor = await Mentor.findById(decoded.id || decoded._id);
            if (!mentor) {
                return res.status(401).json({
                    success: false,
                    message: 'Mentor not found'
                });
            }

            req.mentor = mentor;
            next();
        } catch (jwtErr) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        console.error('Mentor authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Middleware to check if user can access/modify a user-to-mentor chat
const requireUserToMentorChatParticipant = async (req, res, next) => {
    try {
        const { mentorId, userId } = req.params;
        const chatId = req.params.chatId;
        const potentialChatId = chatId || req.params.mentorId || req.params.userId;

        let chat;

        // If we have both mentorId and userId params, find by participants
        if (mentorId && userId) {
            if (req.mentor) {
                // Mentor accessing user chat
                chat = await UserToMentorChat.findOne({
                    mentorId: req.mentor._id || req.mentor.id,
                    userId: userId,
                    isActive: true
                });
            } else if (req.user) {
                // User accessing mentor chat
                chat = await UserToMentorChat.findOne({
                    userId: req.user._id || req.user.id,
                    mentorId: mentorId,
                    isActive: true
                });
            }
        } else if (mentorId && req.user) {
            // Route like /api/chats/:mentorId/messages - find chat by user and mentor
            chat = await UserToMentorChat.findOne({
                userId: req.user._id || req.user.id,
                mentorId: mentorId,
                isActive: true
            });
        } else if (userId && req.mentor) {
            // Route like /api/mentor/chats/:userId/messages - find chat by mentor and user
            chat = await UserToMentorChat.findOne({
                mentorId: req.mentor._id || req.mentor.id,
                userId: userId,
                isActive: true
            });
        } else if (chatId) {
            // Direct chat ID access
            chat = await UserToMentorChat.findOne({
                _id: chatId,
                isActive: true
            });

            if (chat) {
                const isParticipant = req.user
                    ? chat.userId.toString() === (req.user._id || req.user.id).toString()
                    : req.mentor
                        ? chat.mentorId.toString() === (req.mentor._id || req.mentor.id).toString()
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

        req.userToMentorChat = chat;
        next();
    } catch (error) {
        console.error('User-to-mentor chat participant verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Chat verification error'
        });
    }
};

// Middleware to ensure user-to-mentor chat creation is only allowed for users
const requireUserInitiatedUserToMentorChat = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({
            success: false,
            message: 'Only users can initiate chats with mentors'
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

// Middleware to check if user can access/modify a user-to-user chat
const requireUserToUserChatParticipant = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?._id || req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Ensure consistent ordering
        const userIds = [currentUserId, userId].sort((a, b) => a.toString().localeCompare(b.toString()));

        const chat = await UserToUserChat.findOne({
            user1Id: userIds[0],
            user2Id: userIds[1],
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found or inactive'
            });
        }

        // Verify current user is participant
        const isParticipant = chat.user1Id.toString() === currentUserId.toString() ||
            chat.user2Id.toString() === currentUserId.toString();

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Not a participant in this chat'
            });
        }

        req.userToUserChat = chat;
        next();
    } catch (error) {
        console.error('User-to-user chat participant verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Chat verification error'
        });
    }
};

// Middleware to check if mentor can access/modify a mentor-to-mentor chat
const requireMentorToMentorChatParticipant = async (req, res, next) => {
    try {
        const { mentorId } = req.params;
        const currentMentorId = req.mentor?._id || req.mentor?.id;

        if (!currentMentorId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Ensure consistent ordering
        const mentorIds = [currentMentorId, mentorId].sort((a, b) => a.toString().localeCompare(b.toString()));

        const chat = await MentorToMentorChat.findOne({
            mentor1Id: mentorIds[0],
            mentor2Id: mentorIds[1],
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found or inactive'
            });
        }

        // Verify current mentor is participant
        const isParticipant = chat.mentor1Id.toString() === currentMentorId.toString() ||
            chat.mentor2Id.toString() === currentMentorId.toString();

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Not a participant in this chat'
            });
        }

        req.mentorToMentorChat = chat;
        next();
    } catch (error) {
        console.error('Mentor-to-mentor chat participant verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Chat verification error'
        });
    }
};

module.exports = {
    requireUser,
    requireMentor,
    requireUserToMentorChatParticipant,
    requireUserInitiatedUserToMentorChat,
    requireUserToUserChatParticipant,
    requireMentorToMentorChatParticipant
};

