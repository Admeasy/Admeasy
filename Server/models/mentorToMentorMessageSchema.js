const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const mentorToMentorMessageSchema = new mongoose.Schema({
    // Reference to the mentor-to-mentor chat this message belongs to
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorToMentorChat',
        required: true
    },

    // Message sender - a mentor
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentors',
        required: true
    },

    // Message content
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000 // Limit message length
    },

    // Message type (for future extensibility - text, image, etc.)
    messageType: {
        type: String,
        enum: ['text'],
        default: 'text'
    },

    // Message status for delivery tracking
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },

    // Read timestamps
    deliveredAt: {
        type: Date,
        default: null
    },
    readAt: {
        type: Date,
        default: null
    },

    // For message editing/deletion (optional features)
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true, // createdAt, updatedAt
    collection: 'mentor_to_mentor_messages'
});

// Indexes for efficient queries
mentorToMentorMessageSchema.index({ chatId: 1, createdAt: 1 }); // For fetching messages in chat order
mentorToMentorMessageSchema.index({ senderId: 1, createdAt: -1 }); // For mentor message history
mentorToMentorMessageSchema.index({ chatId: 1, senderId: 1, createdAt: -1 }); // For last message queries

module.exports = Admeasy.model('MentorToMentorMessage', mentorToMentorMessageSchema);
