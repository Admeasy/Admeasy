const Chat = require('../models/chatSchema');
const ChatMessage = require('../models/chatMessageSchema');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');
const { Users } = require('../db');
const NotificationService = require('../services/notificationService');
//Ahsan Code
// Get user's chat inbox (all mentors they've chatted with)
const getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const chats = await Chat.find({
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
const getMentorChats = async (req, res) => {
    try {
        const mentorId = req.mentor.id;

        const chats = await Chat.find({
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
                    userId: chat.userId,
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

// Get messages for a specific chat
const getChatMessages = async (req, res) => {
    try {
        const chatId = req.chat._id;
        const userId = req.user?.id;
        const mentorId = req.mentor?.id;

        // Get messages
        const messages = await ChatMessage.find({
            chatId
        })
            .sort({ createdAt: 1 })
            .lean();

        // Mark messages as read for the current user
        if (userId) {
            // User is reading - mark mentor's messages as read for user
            await ChatMessage.updateMany(
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
            await Chat.updateOne(
                { _id: chatId },
                { userUnreadCount: 0 }
            );
        } else if (mentorId) {
            // Mentor is reading - mark user's messages as read for mentor
            await ChatMessage.updateMany(
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
            await Chat.updateOne(
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
                        senderRole: message.senderRole,
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
                    senderRole: message.senderRole,
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
                    senderRole: message.senderRole,
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

// Send a message in a chat
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const chatId = req.chat._id;
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
            const messageCount = await ChatMessage.countDocuments({ chatId });
            if (messageCount === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Mentors can only reply to existing conversations'
                });
            }
        }

        // Create the message
        const newMessage = new ChatMessage({
            chatId,
            senderId,
            senderRole,
            message: message.trim(),
            messageType: 'text',
            status: 'sent'
        });

        await newMessage.save();

        // Update chat's last message and timestamp
        await Chat.updateOne(
            { _id: chatId },
            {
                lastMessage: message.trim(),
                lastMessageTime: new Date(),
                updatedAt: new Date()
            }
        );

        // Update unread counts for the other participant
        const unreadField = senderRole === 'user' ? 'mentorUnreadCount' : 'userUnreadCount';
        await Chat.updateOne(
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

        // Notify recipient
        (async () => {
            try {
                const recipientId = senderRole === 'user' ? req.chat.mentorId : req.chat.userId;
                const senderName = sender?.name || 'Someone';

                await NotificationService.sendToUser(
                    recipientId,
                    'New Message',
                    `${senderName} sent you a message`,
                    {
                        type: 'chat',
                        chatId: chatId.toString(),
                        senderId: senderId.toString()
                    },
                    senderId
                );
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
const createOrGetChat = async (req, res) => {
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
        let chat = await Chat.findOne({
            userId,
            mentorId,
            isActive: true
        });

        // If no chat exists, create one (only users can create chats)
        if (!chat) {
            chat = new Chat({
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
                const existingChat = await Chat.findOne({
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

module.exports = {
    getUserChats,
    getMentorChats,
    getChatMessages,
    sendMessage,
    createOrGetChat
};
