const UserToMentorChat = require('../models/userToMentorChatSchema');
const UserToMentorMessage = require('../models/userToMentorMessageSchema');
const UserToUserChat = require('../models/userToUserChatSchema');
const UserToUserMessage = require('../models/userToUserMessageSchema');
const MentorToMentorChat = require('../models/mentorToMentorChatSchema');
const MentorToMentorMessage = require('../models/mentorToMentorMessageSchema');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');
const { Users } = require('../db');
const NotificationService = require('../services/notificationService');
const NotificationManager = require('../services/notificationManager');

// Get socket.io instance from global
const getSocketIO = () => {
  return global.io;
};

// ========== USER-TO-MENTOR CHAT CONTROLLERS ==========
// Get user's chat inbox (all mentors they've chatted with)
const getUserToMentorChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const chats = await UserToMentorChat.find({
            userId,
            isActive: true
        })
            .sort({ updatedAt: -1 })
            .lean();

        // Manually fetch mentor data (can't rely on populate due to ref mismatch or cross-DB issues)
        const formattedChats = await Promise.all(chats.map(async (chat) => {
            try {
                // Fetch mentor data manually
                const mentor = await Mentor.findById(chat.mentorId).select('name username image').lean();

                // Skip chats where mentor doesn't exist (deleted mentors)
                if (!mentor) {
                    return null;
                }

                // Get unread count for user
                const unreadCount = chat.userUnreadCount || 0;

                return {
                    chatId: chat._id,
                    mentorId: chat.mentorId,
                    mentorName: mentor.name,
                    mentorUsername: mentor.username,
                    mentorImage: mentor.image,
                    lastMessage: chat.lastMessage,
                    lastMessageTime: chat.lastMessageTime,
                    unreadCount,
                    updatedAt: chat.updatedAt
                };
            } catch (mentorError) {
                console.error(`Error fetching mentor ${chat.mentorId}:`, mentorError);
                return null; // Skip this chat if mentor fetch fails
            }
        }));

        // Filter out null values (deleted mentors)
        const validChats = formattedChats.filter(chat => chat !== null);

        res.json({
            success: true,
            chats: validChats
        });
    } catch (error) {
        console.error('Error getting user chats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chats'
        });
    }
};

// Get mentor's chat inbox (all users who've messaged them)
const getMentorToUserChats = async (req, res) => {
    try {
        const mentorId = req.mentor.id;

        const chats = await UserToMentorChat.find({
            mentorId,
            isActive: true
        })
            .sort({ updatedAt: -1 })
            .lean();

        // Manually fetch user data from Users database (can't use populate across different DB connections)
        const UserModel = Users.model('Users');
        const formattedChats = await Promise.all(chats.map(async (chat) => {
            try {
                const user = await UserModel.findById(chat.userId).select('name course image').lean();

                // Skip chats where user doesn't exist (deleted users)
                if (!user) {
                    return null;
                }

                return {
                    chatId: chat._id,
                    userId: String(chat.userId), // Ensure userId is a string
                    userName: user.name || 'Student',
                    userCourse: user.course || '',
                    userImage: user.image || null,
                    lastMessage: chat.lastMessage || null,
                    lastMessageTime: chat.lastMessageTime || null,
                    unreadCount: chat.mentorUnreadCount || 0,
                    updatedAt: chat.updatedAt
                };
            } catch (userError) {
                console.error(`Error fetching user ${chat.userId}:`, userError);
                return null; // Skip this chat if user fetch fails
            }
        }));

        // Filter out null values (deleted users)
        const validChats = formattedChats.filter(chat => chat !== null);

        res.json({
            success: true,
            chats: validChats
        });
    } catch (error) {
        console.error('Error getting mentor chats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chats'
        });
    }
};

// Get messages for a specific user-to-mentor chat
const getUserToMentorChatMessages = async (req, res) => {
    try {
        const chatId = req.userToMentorChat._id;
        const userId = req.user?.id;
        const mentorId = req.mentor?.id;

        // Get messages
        const messages = await UserToMentorMessage.find({
            chatId
        })
            .sort({ createdAt: 1 })
            .lean();

        // Mark messages as read for the current user
        if (userId) {
            // User is reading - mark mentor's messages as read for user
            await UserToMentorMessage.updateMany(
                {
                    chatId,
                    senderId: { $ne: userId }, // Messages not sent by current user
                    status: { $ne: 'read' }
                },
                {
                    status: 'read',
                    readAt: new Date()
                }
            );

            // Reset user's unread count
            await UserToMentorChat.updateOne(
                { _id: chatId },
                { userUnreadCount: 0 }
            );
        } else if (mentorId) {
            // Mentor is reading - mark user's messages as read for mentor
            await UserToMentorMessage.updateMany(
                {
                    chatId,
                    senderId: { $ne: mentorId }, // Messages not sent by current mentor
                    status: { $ne: 'read' }
                },
                {
                    status: 'read',
                    readAt: new Date()
                }
            );

            // Reset mentor's unread count
            await UserToMentorChat.updateOne(
                { _id: chatId },
                { mentorUnreadCount: 0 }
            );
        }

        // Manually fetch sender data (can't use populate across different DB connections or without ref)
        const UserModel = Users.model('Users');
        const formattedMessages = await Promise.all(messages.map(async (message) => {
            try {
                let sender = null;
                if (message.senderRole === 'user') {
                    sender = await UserModel.findById(message.senderId).select('name image').lean();
                } else {
                    sender = await Mentor.findById(message.senderId).select('name image').lean();
                }

                // Handle case where sender doesn't exist (deleted account)
                if (!sender) {
                    return {
                        _id: message._id,
                        senderId: message.senderId,
                        senderRole: message.senderRole || 'user',
                        senderName: 'Deleted User',
                        senderImage: null,
                        message: message.message,
                        status: message.status,
                        createdAt: message.createdAt,
                        readAt: message.readAt
                    };
                }

                return {
                    _id: message._id,
                    senderId: message.senderId,
                    senderRole: message.senderRole || (message.senderRole === 'mentor' ? 'mentor' : 'user'),
                    senderName: sender.name || 'Unknown',
                    senderImage: sender.image || null,
                    message: message.message,
                    status: message.status,
                    createdAt: message.createdAt,
                    readAt: message.readAt
                };
            } catch (senderError) {
                console.error(`Error fetching sender ${message.senderId}:`, senderError);
                return {
                    _id: message._id,
                    senderId: message.senderId,
                    senderRole: message.senderRole || 'user',
                    senderName: 'Unknown',
                    senderImage: null,
                    message: message.message,
                    status: message.status,
                    createdAt: message.createdAt,
                    readAt: message.readAt
                };
            }
        }));

        res.json({
            success: true,
            messages: formattedMessages,
            chatId
        });
    } catch (error) {
        console.error('Error getting chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
};

// Send a message in a user-to-mentor chat
const sendUserToMentorMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const chatId = req.userToMentorChat._id;
        const senderId = req.user?.id || req.mentor?.id;
        const senderRole = req.user ? 'user' : 'mentor';

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message cannot be empty'
            });
        }

        // For mentors, ensure there's an existing conversation (they can't initiate)
        if (senderRole === 'mentor') {
            const messageCount = await UserToMentorMessage.countDocuments({ chatId });
            if (messageCount === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Mentors can only reply to existing conversations'
                });
            }
        }

        // Create the message
        const newMessage = new UserToMentorMessage({
            chatId,
            senderId,
            senderRole,
            message: message.trim(),
            messageType: 'text',
            status: 'sent'
        });

        await newMessage.save();

        // Update chat's last message and timestamp
        await UserToMentorChat.updateOne(
            { _id: chatId },
            {
                lastMessage: message.trim(),
                lastMessageTime: new Date(),
                updatedAt: new Date()
            }
        );

        // Update unread counts for the other participant
        const unreadField = senderRole === 'user' ? 'mentorUnreadCount' : 'userUnreadCount';
        await UserToMentorChat.updateOne(
            { _id: chatId },
            { $inc: { [unreadField]: 1 } }
        );

        // Manually fetch sender info (can't use populate across different DB connections or without ref)
        let sender = null;
        if (senderRole === 'user') {
            const UserModel = Users.model('Users');
            sender = await UserModel.findById(senderId).select('name image').lean();
        } else {
            sender = await Mentor.findById(senderId).select('name image').lean();
        }

        // Format response
        const formattedMessage = {
            _id: newMessage._id,
            senderId: senderId,
            senderRole: newMessage.senderRole,
            senderName: sender?.name || 'Unknown',
            senderImage: sender?.image || null,
            message: newMessage.message,
            status: newMessage.status,
            createdAt: newMessage.createdAt
        };

        res.json({
            success: true,
            message: formattedMessage
        });

        // Emit socket event for real-time updates
        const io = getSocketIO();
        if (io) {
            // Broadcast to chat room for real-time updates
            io.to(`chat:${chatId}`).emit('receive_message', {
                ...formattedMessage,
                chatId: chatId.toString()
            });
        }

        // Notify recipient using new notification system (includes push notification)
        (async () => {
            try {
                const recipientId = senderRole === 'user' ? req.userToMentorChat.mentorId : req.userToMentorChat.userId;
                const recipientRole = senderRole === 'user' ? 'mentor' : 'user';
                const senderName = sender?.name || 'Someone';
                const senderUsername = sender?.username || null;
                const senderImage = sender?.image || null;
                
                // Determine originPath - use sender's ID for chat route
                const originPath = senderRole === 'user' 
                    ? `/mentor/chats/${senderId}` 
                    : `/chats/${senderId}`;

                await NotificationManager.createAndSend({
                    recipientId,
                    recipientRole,
                    actorId: senderId,
                    type: 'MESSAGE',
                    entityType: 'MESSAGE',
                    entityId: newMessage._id,
                    originPath,
                    message: `${senderName} sent you a message`,
                    actorInfo: { name: senderName, username: senderUsername, image: senderImage },
                });
            } catch (notifyError) {
                console.error('Error sending chat notification:', notifyError);
            }
        })();
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

// Create or get existing chat between user and mentor
const createOrGetUserToMentorChat = async (req, res) => {
    try {
        const mentorId = req.params.mentorId;
        const userId = req.user.id;

        // Verify mentor exists
        const mentor = await Mentor.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Try to find existing chat
        let chat = await UserToMentorChat.findOne({
            userId,
            mentorId,
            isActive: true
        });

        // If no chat exists, create one (only users can create chats)
        if (!chat) {
            chat = new UserToMentorChat({
                userId,
                mentorId,
                initiatedBy: 'user',
                isActive: true
            });
            await chat.save();
        }

        res.json({
            success: true,
            chat: {
                chatId: chat._id,
                mentorId: mentor._id,
                mentorName: mentor.name,
                mentorUsername: mentor.username,
                mentorImage: mentor.image,
                createdAt: chat.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating/getting chat:', error);
        if (error.code === 11000) { // Duplicate key error
            // Try to get the existing chat
            try {
                const existingChat = await UserToMentorChat.findOne({
                    userId: req.user.id,
                    mentorId: req.params.mentorId,
                    isActive: true
                });

                if (existingChat) {
                    const mentor = await Mentor.findById(req.params.mentorId);
                    return res.json({
                        success: true,
                        chat: {
                            chatId: existingChat._id,
                            mentorId: mentor._id,
                            mentorName: mentor.name,
                            mentorUsername: mentor.username,
                            mentorImage: mentor.image,
                            createdAt: existingChat.createdAt
                        }
                    });
                }
            } catch (retryError) {
                console.error('Error retrying chat creation:', retryError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create or access chat'
        });
    }
};

// Get existing chat between mentor and user (mentor accessing user chat)
// Mentors can only access existing chats, they cannot create new ones
const getMentorToUserChat = async (req, res) => {
    try {
        const userId = req.params.userId;
        const mentorId = req.mentor.id;

        // Verify user exists
        const UserModel = Users.model('Users');
        const user = await UserModel.findById(userId).select('name username image').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Try to find existing chat
        const chat = await UserToMentorChat.findOne({
            userId,
            mentorId,
            isActive: true
        });

        // If no chat exists, return 404 (mentors cannot initiate chats)
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found. You can only access chats that have been initiated by users.'
            });
        }

        res.json({
            success: true,
            chat: {
                chatId: chat._id,
                userId: user._id,
                userName: user.name || 'Student',
                userUsername: user.username,
                userImage: user.image,
                createdAt: chat.createdAt
            }
        });
    } catch (error) {
        console.error('Error getting mentor-to-user chat:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to access chat'
        });
    }
};

// ========== USER-TO-USER CHAT CONTROLLERS ==========

// Get user's user-to-user chat inbox (all users they've chatted with)
const getUserToUserChats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all chats where user is either user1 or user2
        const chats = await UserToUserChat.find({
            $or: [
                { user1Id: userId, isActive: true },
                { user2Id: userId, isActive: true }
            ]
        })
            .sort({ updatedAt: -1 })
            .lean();

        const UserModel = Users.model('Users');
        const formattedChats = await Promise.all(chats.map(async (chat) => {
            try {
                // Determine the other user
                const otherUserId = chat.user1Id.toString() === userId.toString() 
                    ? chat.user2Id 
                    : chat.user1Id;

                const otherUser = await UserModel.findById(otherUserId).select('name username image').lean();

                if (!otherUser) {
                    return null;
                }

                // Get unread count for current user
                const unreadCount = chat.user1Id.toString() === userId.toString()
                    ? chat.user1UnreadCount || 0
                    : chat.user2UnreadCount || 0;

                return {
                    chatId: chat._id,
                    otherUserId: otherUserId,
                    otherUserName: otherUser.name,
                    otherUserUsername: otherUser.username,
                    otherUserImage: otherUser.image,
                    lastMessage: chat.lastMessage,
                    lastMessageTime: chat.lastMessageTime,
                    unreadCount,
                    updatedAt: chat.updatedAt
                };
            } catch (error) {
                console.error(`Error fetching user ${chat.user1Id === userId ? chat.user2Id : chat.user1Id}:`, error);
                return null;
            }
        }));

        const validChats = formattedChats.filter(chat => chat !== null);

        res.json({
            success: true,
            chats: validChats
        });
    } catch (error) {
        console.error('Error getting user-to-user chats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chats'
        });
    }
};

// Get messages for a user-to-user chat
const getUserToUserChatMessages = async (req, res) => {
    try {
        const chatId = req.userToUserChat._id;
        const userId = req.user.id;

        const messages = await UserToUserMessage.find({
            chatId
        })
            .sort({ createdAt: 1 })
            .lean();

        // Mark messages as read for the current user
        await UserToUserMessage.updateMany(
            {
                chatId,
                senderId: { $ne: userId },
                status: { $ne: 'read' }
            },
            {
                status: 'read',
                readAt: new Date()
            }
        );

        // Reset unread count for current user
        const chat = await UserToUserChat.findById(chatId);
        if (chat.user1Id.toString() === userId.toString()) {
            await UserToUserChat.updateOne(
                { _id: chatId },
                { user1UnreadCount: 0 }
            );
        } else {
            await UserToUserChat.updateOne(
                { _id: chatId },
                { user2UnreadCount: 0 }
            );
        }

        // Fetch sender data
        const UserModel = Users.model('Users');
        const formattedMessages = await Promise.all(messages.map(async (message) => {
            try {
                const sender = await UserModel.findById(message.senderId).select('name image').lean();

                if (!sender) {
                    return {
                        _id: message._id,
                        senderId: message.senderId,
                        senderRole: 'user',
                        senderName: 'Deleted User',
                        senderImage: null,
                        message: message.message,
                        status: message.status,
                        createdAt: message.createdAt,
                        readAt: message.readAt
                    };
                }

                return {
                    _id: message._id,
                    senderId: message.senderId,
                    senderRole: 'user',
                    senderName: sender.name || 'Unknown',
                    senderImage: sender.image || null,
                    message: message.message,
                    status: message.status,
                    createdAt: message.createdAt,
                    readAt: message.readAt
                };
            } catch (senderError) {
                console.error(`Error fetching sender ${message.senderId}:`, senderError);
                return {
                    _id: message._id,
                    senderId: message.senderId,
                    senderRole: 'user',
                    senderName: 'Unknown',
                    senderImage: null,
                    message: message.message,
                    status: message.status,
                    createdAt: message.createdAt,
                    readAt: message.readAt
                };
            }
        }));

        res.json({
            success: true,
            messages: formattedMessages,
            chatId
        });
    } catch (error) {
        console.error('Error getting user-to-user chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
};

// Send a message in a user-to-user chat
const sendUserToUserMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const chatId = req.userToUserChat._id;
        const senderId = req.user.id;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message cannot be empty'
            });
        }

        const newMessage = new UserToUserMessage({
            chatId,
            senderId,
            message: message.trim(),
            messageType: 'text',
            status: 'sent'
        });

        await newMessage.save();

        // Update chat's last message and timestamp
        await UserToUserChat.updateOne(
            { _id: chatId },
            {
                lastMessage: message.trim(),
                lastMessageTime: new Date(),
                updatedAt: new Date()
            }
        );

        // Update unread count for the other user
        const chat = await UserToUserChat.findById(chatId);
        const unreadField = chat.user1Id.toString() === senderId.toString() 
            ? 'user2UnreadCount' 
            : 'user1UnreadCount';
        await UserToUserChat.updateOne(
            { _id: chatId },
            { $inc: { [unreadField]: 1 } }
        );

        // Fetch sender info
        const UserModel = Users.model('Users');
        const sender = await UserModel.findById(senderId).select('name image').lean();

        const formattedMessage = {
            _id: newMessage._id,
            senderId: senderId,
            senderName: sender?.name || 'Unknown',
            senderImage: sender?.image || null,
            message: newMessage.message,
            status: newMessage.status,
            createdAt: newMessage.createdAt
        };

        res.json({
            success: true,
            message: formattedMessage
        });

        // Notify recipient
        (async () => {
            try {
                const recipientId = chat.user1Id.toString() === senderId.toString()
                    ? chat.user2Id
                    : chat.user1Id;
                const senderName = sender?.name || 'Someone';
                const senderUsername = sender?.username || null;
                const senderImage = sender?.image || null;

                await NotificationManager.createAndSend({
                    recipientId,
                    recipientRole: 'user',
                    actorId: senderId,
                    type: 'MESSAGE',
                    entityType: 'MESSAGE',
                    entityId: newMessage._id,
                    originPath: `/chats/${senderId}`,
                    message: `${senderName} sent you a message`,
                    actorInfo: { name: senderName, username: senderUsername, image: senderImage },
                });
            } catch (notifyError) {
                console.error('Error sending chat notification:', notifyError);
            }
        })();
    } catch (error) {
        console.error('Error sending user-to-user message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

// Create or get existing chat between two users
const createOrGetUserToUserChat = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const userId = req.user.id;

        if (otherUserId === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot chat with yourself'
            });
        }

        // Verify other user exists
        const UserModel = Users.model('Users');
        const otherUser = await UserModel.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Ensure consistent ordering: user1Id < user2Id (by string comparison)
        const userIds = [userId, otherUserId].sort((a, b) => a.toString().localeCompare(b.toString()));
        const user1Id = userIds[0];
        const user2Id = userIds[1];

        // Try to find existing chat
        let chat = await UserToUserChat.findOne({
            user1Id,
            user2Id,
            isActive: true
        });

        // If no chat exists, create one
        if (!chat) {
            chat = new UserToUserChat({
                user1Id,
                user2Id,
                initiatedBy: userId,
                isActive: true
            });
            await chat.save();
        }

        // Get the other user's info
        const otherUserInfo = user1Id.toString() === userId.toString() 
            ? await UserModel.findById(user2Id).select('name username image').lean()
            : await UserModel.findById(user1Id).select('name username image').lean();

        res.json({
            success: true,
            chat: {
                chatId: chat._id,
                otherUserId: otherUserId,
                otherUserName: otherUserInfo.name,
                otherUserUsername: otherUserInfo.username,
                otherUserImage: otherUserInfo.image,
                createdAt: chat.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating/getting user-to-user chat:', error);
        if (error.code === 11000) {
            try {
                const userIds = [req.user.id, req.params.userId].sort((a, b) => a.toString().localeCompare(b.toString()));
                const existingChat = await UserToUserChat.findOne({
                    user1Id: userIds[0],
                    user2Id: userIds[1],
                    isActive: true
                });

                if (existingChat) {
                    const UserModel = Users.model('Users');
                    const otherUserId = userIds[0].toString() === req.user.id.toString() ? userIds[1] : userIds[0];
                    const otherUser = await UserModel.findById(otherUserId).select('name username image').lean();
                    return res.json({
                        success: true,
                        chat: {
                            chatId: existingChat._id,
                            otherUserId: otherUserId,
                            otherUserName: otherUser.name,
                            otherUserUsername: otherUser.username,
                            otherUserImage: otherUser.image,
                            createdAt: existingChat.createdAt
                        }
                    });
                }
            } catch (retryError) {
                console.error('Error retrying chat creation:', retryError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create or access chat'
        });
    }
};

// ========== MENTOR-TO-MENTOR CHAT CONTROLLERS ==========

// Get mentor's mentor-to-mentor chat inbox (all mentors they've chatted with)
const getMentorToMentorChats = async (req, res) => {
    try {
        const mentorId = req.mentor.id;

        // Find all chats where mentor is either mentor1 or mentor2
        const chats = await MentorToMentorChat.find({
            $or: [
                { mentor1Id: mentorId, isActive: true },
                { mentor2Id: mentorId, isActive: true }
            ]
        })
            .sort({ updatedAt: -1 })
            .lean();

        const formattedChats = await Promise.all(chats.map(async (chat) => {
            try {
                // Determine the other mentor
                const otherMentorId = chat.mentor1Id.toString() === mentorId.toString() 
                    ? chat.mentor2Id 
                    : chat.mentor1Id;

                const otherMentor = await Mentor.findById(otherMentorId).select('name username image').lean();

                if (!otherMentor) {
                    return null;
                }

                // Get unread count for current mentor
                const unreadCount = chat.mentor1Id.toString() === mentorId.toString()
                    ? chat.mentor1UnreadCount || 0
                    : chat.mentor2UnreadCount || 0;

                return {
                    chatId: chat._id,
                    otherMentorId: otherMentorId,
                    otherMentorName: otherMentor.name,
                    otherMentorUsername: otherMentor.username,
                    otherMentorImage: otherMentor.image,
                    lastMessage: chat.lastMessage,
                    lastMessageTime: chat.lastMessageTime,
                    unreadCount,
                    updatedAt: chat.updatedAt
                };
            } catch (error) {
                console.error(`Error fetching mentor ${chat.mentor1Id === mentorId ? chat.mentor2Id : chat.mentor1Id}:`, error);
                return null;
            }
        }));

        const validChats = formattedChats.filter(chat => chat !== null);

        res.json({
            success: true,
            chats: validChats
        });
    } catch (error) {
        console.error('Error getting mentor-to-mentor chats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chats'
        });
    }
};

// Get messages for a mentor-to-mentor chat
const getMentorToMentorChatMessages = async (req, res) => {
    try {
        const chatId = req.mentorToMentorChat._id;
        const mentorId = req.mentor.id;

        const messages = await MentorToMentorMessage.find({
            chatId
        })
            .sort({ createdAt: 1 })
            .lean();

        // Mark messages as read for the current mentor
        await MentorToMentorMessage.updateMany(
            {
                chatId,
                senderId: { $ne: mentorId },
                status: { $ne: 'read' }
            },
            {
                status: 'read',
                readAt: new Date()
            }
        );

        // Reset unread count for current mentor
        const chat = await MentorToMentorChat.findById(chatId);
        if (chat.mentor1Id.toString() === mentorId.toString()) {
            await MentorToMentorChat.updateOne(
                { _id: chatId },
                { mentor1UnreadCount: 0 }
            );
        } else {
            await MentorToMentorChat.updateOne(
                { _id: chatId },
                { mentor2UnreadCount: 0 }
            );
        }

        // Fetch sender data
        const formattedMessages = await Promise.all(messages.map(async (message) => {
            try {
                const sender = await Mentor.findById(message.senderId).select('name image').lean();

                if (!sender) {
                    return {
                        _id: message._id,
                        senderId: message.senderId,
                        senderName: 'Deleted Mentor',
                        senderImage: null,
                        message: message.message,
                        status: message.status,
                        createdAt: message.createdAt,
                        readAt: message.readAt
                    };
                }

                return {
                    _id: message._id,
                    senderId: message.senderId,
                    senderRole: 'user',
                    senderName: sender.name || 'Unknown',
                    senderImage: sender.image || null,
                    message: message.message,
                    status: message.status,
                    createdAt: message.createdAt,
                    readAt: message.readAt
                };
            } catch (senderError) {
                console.error(`Error fetching sender ${message.senderId}:`, senderError);
                return {
                    _id: message._id,
                    senderId: message.senderId,
                    senderName: 'Unknown',
                    senderImage: null,
                    message: message.message,
                    status: message.status,
                    createdAt: message.createdAt,
                    readAt: message.readAt
                };
            }
        }));

        res.json({
            success: true,
            messages: formattedMessages,
            chatId
        });
    } catch (error) {
        console.error('Error getting mentor-to-mentor chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
};

// Send a message in a mentor-to-mentor chat
const sendMentorToMentorMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const chatId = req.mentorToMentorChat._id;
        const senderId = req.mentor.id;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message cannot be empty'
            });
        }

        const newMessage = new MentorToMentorMessage({
            chatId,
            senderId,
            message: message.trim(),
            messageType: 'text',
            status: 'sent'
        });

        await newMessage.save();

        // Update chat's last message and timestamp
        await MentorToMentorChat.updateOne(
            { _id: chatId },
            {
                lastMessage: message.trim(),
                lastMessageTime: new Date(),
                updatedAt: new Date()
            }
        );

        // Update unread count for the other mentor
        const chat = await MentorToMentorChat.findById(chatId);
        const unreadField = chat.mentor1Id.toString() === senderId.toString() 
            ? 'mentor2UnreadCount' 
            : 'mentor1UnreadCount';
        await MentorToMentorChat.updateOne(
            { _id: chatId },
            { $inc: { [unreadField]: 1 } }
        );

        // Fetch sender info
        const sender = await Mentor.findById(senderId).select('name image').lean();

        const formattedMessage = {
            _id: newMessage._id,
            senderId: senderId,
            senderName: sender?.name || 'Unknown',
            senderImage: sender?.image || null,
            message: newMessage.message,
            status: newMessage.status,
            createdAt: newMessage.createdAt
        };

        res.json({
            success: true,
            message: formattedMessage
        });

        // Notify recipient
        (async () => {
            try {
                const recipientId = chat.mentor1Id.toString() === senderId.toString()
                    ? chat.mentor2Id
                    : chat.mentor1Id;
                const senderName = sender?.name || 'Someone';
                const senderUsername = sender?.username || null;
                const senderImage = sender?.image || null;

                await NotificationManager.createAndSend({
                    recipientId,
                    recipientRole: 'mentor',
                    actorId: senderId,
                    type: 'MESSAGE',
                    entityType: 'MESSAGE',
                    entityId: newMessage._id,
                    originPath: `/mentor/chats/${senderId}`,
                    message: `${senderName} sent you a message`,
                    actorInfo: { name: senderName, username: senderUsername, image: senderImage },
                });
            } catch (notifyError) {
                console.error('Error sending chat notification:', notifyError);
            }
        })();
    } catch (error) {
        console.error('Error sending mentor-to-mentor message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

// Create or get existing chat between two mentors
const createOrGetMentorToMentorChat = async (req, res) => {
    try {
        const otherMentorId = req.params.mentorId;
        const mentorId = req.mentor.id;

        if (otherMentorId === mentorId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot chat with yourself'
            });
        }

        // Verify other mentor exists
        const otherMentor = await Mentor.findById(otherMentorId);
        if (!otherMentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Ensure consistent ordering: mentor1Id < mentor2Id (by string comparison)
        const mentorIds = [mentorId, otherMentorId].sort((a, b) => a.toString().localeCompare(b.toString()));
        const mentor1Id = mentorIds[0];
        const mentor2Id = mentorIds[1];

        // Try to find existing chat
        let chat = await MentorToMentorChat.findOne({
            mentor1Id,
            mentor2Id,
            isActive: true
        });

        // If no chat exists, create one
        if (!chat) {
            chat = new MentorToMentorChat({
                mentor1Id,
                mentor2Id,
                initiatedBy: mentorId,
                isActive: true
            });
            await chat.save();
        }

        // Get the other mentor's info
        const otherMentorInfo = mentor1Id.toString() === mentorId.toString() 
            ? await Mentor.findById(mentor2Id).select('name username image').lean()
            : await Mentor.findById(mentor1Id).select('name username image').lean();

        res.json({
            success: true,
            chat: {
                chatId: chat._id,
                otherMentorId: otherMentorId,
                otherMentorName: otherMentorInfo.name,
                otherMentorUsername: otherMentorInfo.username,
                otherMentorImage: otherMentorInfo.image,
                createdAt: chat.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating/getting mentor-to-mentor chat:', error);
        if (error.code === 11000) {
            try {
                const mentorIds = [req.mentor.id, req.params.mentorId].sort((a, b) => a.toString().localeCompare(b.toString()));
                const existingChat = await MentorToMentorChat.findOne({
                    mentor1Id: mentorIds[0],
                    mentor2Id: mentorIds[1],
                    isActive: true
                });

                if (existingChat) {
                    const otherMentorId = mentorIds[0].toString() === req.mentor.id.toString() ? mentorIds[1] : mentorIds[0];
                    const otherMentor = await Mentor.findById(otherMentorId).select('name username image').lean();
                    return res.json({
                        success: true,
                        chat: {
                            chatId: existingChat._id,
                            otherMentorId: otherMentorId,
                            otherMentorName: otherMentor.name,
                            otherMentorUsername: otherMentor.username,
                            otherMentorImage: otherMentor.image,
                            createdAt: existingChat.createdAt
                        }
                    });
                }
            } catch (retryError) {
                console.error('Error retrying chat creation:', retryError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create or access chat'
        });
    }
};

// ========== COMBINED CHAT LIST CONTROLLERS ==========
// Get all chats for a user (both user-to-mentor and user-to-user)
const getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch both types of chats in parallel
        const [userToMentorChats, userToUserChats] = await Promise.all([
            getUserToMentorChatsData(userId),
            getUserToUserChatsData(userId)
        ]);

        // Combine and sort by lastMessageTime
        const allChats = [...userToMentorChats, ...userToUserChats].sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

        res.json({
            success: true,
            chats: allChats
        });
    } catch (error) {
        console.error('Error getting user chats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chats'
        });
    }
};

// Helper function to get user-to-mentor chats data
const getUserToMentorChatsData = async (userId) => {
    const chats = await UserToMentorChat.find({
        userId,
        isActive: true
    })
        .sort({ updatedAt: -1 })
        .lean();

    const formattedChats = await Promise.all(chats.map(async (chat) => {
        try {
            const mentor = await Mentor.findById(chat.mentorId).select('name username image').lean();
            if (!mentor) return null;

            return {
                chatId: chat._id,
                chatType: 'userToMentor',
                otherUserId: chat.mentorId,
                otherUserName: mentor.name,
                otherUserUsername: mentor.username,
                otherUserImage: mentor.image,
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unreadCount: chat.userUnreadCount || 0,
                updatedAt: chat.updatedAt
            };
        } catch (error) {
            console.error(`Error fetching mentor ${chat.mentorId}:`, error);
            return null;
        }
    }));

    return formattedChats.filter(chat => chat !== null);
};

// Helper function to get user-to-user chats data
const getUserToUserChatsData = async (userId) => {
    const chats = await UserToUserChat.find({
        $or: [
            { user1Id: userId, isActive: true },
            { user2Id: userId, isActive: true }
        ]
    })
        .sort({ updatedAt: -1 })
        .lean();

    const UserModel = Users.model('Users');
    const formattedChats = await Promise.all(chats.map(async (chat) => {
        try {
            const otherUserId = chat.user1Id.toString() === userId.toString() 
                ? chat.user2Id 
                : chat.user1Id;

            const otherUser = await UserModel.findById(otherUserId).select('name username image').lean();
            if (!otherUser) return null;

            const unreadCount = chat.user1Id.toString() === userId.toString()
                ? chat.user1UnreadCount || 0
                : chat.user2UnreadCount || 0;

            return {
                chatId: chat._id,
                chatType: 'userToUser',
                otherUserId: otherUserId,
                otherUserName: otherUser.name,
                otherUserUsername: otherUser.username,
                otherUserImage: otherUser.image,
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unreadCount,
                updatedAt: chat.updatedAt
            };
        } catch (error) {
            console.error(`Error fetching user:`, error);
            return null;
        }
    }));

    return formattedChats.filter(chat => chat !== null);
};

// Get all chats for a mentor (both mentor-to-user and mentor-to-mentor)
const getMentorChats = async (req, res) => {
    try {
        const mentorId = req.mentor.id;

        // Fetch both types of chats in parallel
        const [mentorToUserChats, mentorToMentorChats] = await Promise.all([
            getMentorToUserChatsData(mentorId),
            getMentorToMentorChatsData(mentorId)
        ]);

        // Combine and sort by lastMessageTime
        const allChats = [...mentorToUserChats, ...mentorToMentorChats].sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

        res.json({
            success: true,
            chats: allChats
        });
    } catch (error) {
        console.error('Error getting mentor chats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chats'
        });
    }
};

// Helper function to get mentor-to-user chats data
const getMentorToUserChatsData = async (mentorId) => {
    const chats = await UserToMentorChat.find({
        mentorId,
        isActive: true
    })
        .sort({ updatedAt: -1 })
        .lean();

    const UserModel = Users.model('Users');
    const formattedChats = await Promise.all(chats.map(async (chat) => {
        try {
            const user = await UserModel.findById(chat.userId).select('name course image').lean();
            if (!user) return null;

            return {
                chatId: chat._id,
                chatType: 'mentorToUser',
                otherUserId: String(chat.userId),
                otherUserName: user.name || 'Student',
                otherUserCourse: user.course || '',
                otherUserImage: user.image || null,
                lastMessage: chat.lastMessage || null,
                lastMessageTime: chat.lastMessageTime || null,
                unreadCount: chat.mentorUnreadCount || 0,
                updatedAt: chat.updatedAt
            };
        } catch (error) {
            console.error(`Error fetching user ${chat.userId}:`, error);
            return null;
        }
    }));

    return formattedChats.filter(chat => chat !== null);
};

// Helper function to get mentor-to-mentor chats data
const getMentorToMentorChatsData = async (mentorId) => {
    const chats = await MentorToMentorChat.find({
        $or: [
            { mentor1Id: mentorId, isActive: true },
            { mentor2Id: mentorId, isActive: true }
        ]
    })
        .sort({ updatedAt: -1 })
        .lean();

    const formattedChats = await Promise.all(chats.map(async (chat) => {
        try {
            const otherMentorId = chat.mentor1Id.toString() === mentorId.toString() 
                ? chat.mentor2Id 
                : chat.mentor1Id;

            const otherMentor = await Mentor.findById(otherMentorId).select('name username image').lean();
            if (!otherMentor) return null;

            const unreadCount = chat.mentor1Id.toString() === mentorId.toString()
                ? chat.mentor1UnreadCount || 0
                : chat.mentor2UnreadCount || 0;

            return {
                chatId: chat._id,
                chatType: 'mentorToMentor',
                otherUserId: otherMentorId,
                otherUserName: otherMentor.name,
                otherUserUsername: otherMentor.username,
                otherUserImage: otherMentor.image,
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unreadCount,
                updatedAt: chat.updatedAt
            };
        } catch (error) {
            console.error(`Error fetching mentor:`, error);
            return null;
        }
    }));

    return formattedChats.filter(chat => chat !== null);
};

module.exports = {
    // Combined chat list exports
    getUserChats,
    getMentorChats,
    // User-to-mentor chat exports
    getUserToMentorChats,
    getMentorToUserChats,
    getUserToMentorChatMessages,
    sendUserToMentorMessage,
    createOrGetUserToMentorChat,
    getMentorToUserChat,
    // User-to-user chat exports
    getUserToUserChats,
    getUserToUserChatMessages,
    sendUserToUserMessage,
    createOrGetUserToUserChat,
    // Mentor-to-mentor chat exports
    getMentorToMentorChats,
    getMentorToMentorChatMessages,
    sendMentorToMentorMessage,
    createOrGetMentorToMentorChat
};
