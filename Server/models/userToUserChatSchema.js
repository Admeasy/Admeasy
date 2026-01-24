const mongoose = require('mongoose');
const { Chats } = require('../db');

const userToUserChatSchema = new mongoose.Schema({
    // Chat participants - two users
    user1Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    user2Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },

    // Chat metadata
    lastMessage: {
        type: String,
        default: null
    },
    lastMessageTime: {
        type: Date,
        default: null
    },

    // Unread counts for each user
    user1UnreadCount: {
        type: Number,
        default: 0
    },
    user2UnreadCount: {
        type: Number,
        default: 0
    },

    // Chat status
    isActive: {
        type: Boolean,
        default: true
    },

    // Track who initiated the chat
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }
}, {
    timestamps: true, // createdAt, updatedAt
    collection: 'user_to_user_chats'
});

// Compound index to ensure unique chat between two users
// Ensure user1Id < user2Id for consistency (or use a different approach)
userToUserChatSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

// Index for efficient queries
userToUserChatSchema.index({ updatedAt: -1 }); // For sorting recent chats
userToUserChatSchema.index({ user1Id: 1, updatedAt: -1 }); // For user1 inbox
userToUserChatSchema.index({ user2Id: 1, updatedAt: -1 }); // For user2 inbox

module.exports = Chats.model('UserToUserChat', userToUserChatSchema);
