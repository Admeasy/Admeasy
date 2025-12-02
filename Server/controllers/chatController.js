const Chat = require('../models/chatSchema');
const ChatMessage = require('../models/chatMessageSchema');
const User = require('../models/userSchema');
const Mentor = require('../models/mentorSchema');

// Get user's chat inbox (all mentors they've chatted with)
const getUserChats = async (req, res) => {
    try {
        const userId = req.user._id;

        const chats = await Chat.find({
            userId,
            isActive: true
        })
        .populate('mentorId', 'name username image')
        .sort({ updatedAt: -1 })
        .lean();

        // Format response for frontend
        const formattedChats = await Promise.all(chats.map(async (chat) => {
            // Get unread count for user
            const unreadCount = chat.userUnreadCount || 0;

            return {
                chatId: chat._id,
                mentorId: chat.mentorId._id,
                mentorName: chat.mentorId.name,
                mentorUsername: chat.mentorId.username,
                mentorImage: chat.mentorId.image,
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                unreadCount,
                updatedAt: chat.updatedAt
            };
        }));

        res.json({
            success: true,
            chats: formattedChats
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
        const mentorId = req.mentor._id;

        const chats = await Chat.find({
            mentorId,
            isActive: true
        })
        .populate('userId', 'name course image')
        .sort({ updatedAt: -1 })
        .lean();

        // Format response for frontend
        const formattedChats = chats.map(chat => ({
            chatId: chat._id,
            userId: chat.userId._id,
            userName: chat.userId.name,
            userCourse: chat.userId.course,
            userImage: chat.userId.image,
            lastMessage: chat.lastMessage,
            lastMessageTime: chat.lastMessageTime,
            unreadCount: chat.mentorUnreadCount || 0,
            updatedAt: chat.updatedAt
        }));

        res.json({
            success: true,
            chats: formattedChats
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
        const userId = req.user?._id;
        const mentorId = req.mentor?._id;

        // Get messages
        const messages = await ChatMessage.find({
            chatId
        })
        .populate('senderId', 'name image')
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

        // Format messages for frontend
        const formattedMessages = messages.map(message => ({
            _id: message._id,
            senderId: message.senderId._id,
            senderRole: message.senderRole,
            senderName: message.senderId.name,
            senderImage: message.senderId.image,
            message: message.message,
            status: message.status,
            createdAt: message.createdAt,
            readAt: message.readAt
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
        const senderId = req.user?._id || req.mentor?._id;
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

        // Populate sender info for response
        await newMessage.populate('senderId', 'name image');

        // Format response
        const formattedMessage = {
            _id: newMessage._id,
            senderId: newMessage.senderId._id,
            senderRole: newMessage.senderRole,
            senderName: newMessage.senderId.name,
            senderImage: newMessage.senderId.image,
            message: newMessage.message,
            status: newMessage.status,
            createdAt: newMessage.createdAt
        };

        res.json({
            success: true,
            message: formattedMessage
        });
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
        const userId = req.user._id;

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
                    userId: req.user._id,
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
