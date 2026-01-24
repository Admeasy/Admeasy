const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const mentorToMentorChatSchema = new mongoose.Schema({
    // Chat participants - two mentors
    mentor1Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentors',
        required: true
    },
    mentor2Id: {
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

    // Unread counts for each mentor
    mentor1UnreadCount: {
        type: Number,
        default: 0
    },
    mentor2UnreadCount: {
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
        ref: 'Mentors',
        required: true
    }
}, {
    timestamps: true, // createdAt, updatedAt
    collection: 'mentor_to_mentor_chats'
});

// Compound index to ensure unique chat between two mentors
mentorToMentorChatSchema.index({ mentor1Id: 1, mentor2Id: 1 }, { unique: true });

// Index for efficient queries
mentorToMentorChatSchema.index({ updatedAt: -1 }); // For sorting recent chats
mentorToMentorChatSchema.index({ mentor1Id: 1, updatedAt: -1 }); // For mentor1 inbox
mentorToMentorChatSchema.index({ mentor2Id: 1, updatedAt: -1 }); // For mentor2 inbox

module.exports = Admeasy.model('MentorToMentorChat', mentorToMentorChatSchema);
