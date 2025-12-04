const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const chatSchema = new mongoose.Schema({
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
chatSchema.index({ userId: 1, mentorId: 1 }, { unique: true });

// Index for efficient queries
chatSchema.index({ updatedAt: -1 }); // For sorting recent chats
chatSchema.index({ userId: 1, updatedAt: -1 }); // For user inbox
chatSchema.index({ mentorId: 1, updatedAt: -1 }); // For mentor inbox

module.exports = Admeasy.model('Chat', chatSchema);
