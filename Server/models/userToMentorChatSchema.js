const mongoose = require('mongoose');
const { Chats } = require('../db');

const userToMentorChatSchema = new mongoose.Schema({
    // Chat participants - exactly one user and one mentor
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentors',
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

    // Unread counts
    userUnreadCount: {
        type: Number,
        default: 0
    },
    mentorUnreadCount: {
        type: Number,
        default: 0
    },

    // Chat status
    isActive: {
        type: Boolean,
        default: true
    },

    // Track who initiated the chat (should always be user)
    initiatedBy: {
        type: String,
        enum: ['user'], // Only users can initiate chats
        required: true
    }
}, {
    timestamps: true, // createdAt, updatedAt
    collection: 'chats'
});

// Compound index to ensure unique chat between user and mentor
userToMentorChatSchema.index({ userId: 1, mentorId: 1 }, { unique: true });

// Index for efficient queries
userToMentorChatSchema.index({ updatedAt: -1 }); // For sorting recent chats
userToMentorChatSchema.index({ userId: 1, updatedAt: -1 }); // For user inbox
userToMentorChatSchema.index({ mentorId: 1, updatedAt: -1 }); // For mentor inbox

module.exports = Chats.model('UserToMentorChat', userToMentorChatSchema);
