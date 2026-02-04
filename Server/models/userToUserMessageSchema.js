const mongoose = require('mongoose');
const { Chats } = require('../db');

const userToUserMessageSchema = new mongoose.Schema({
    // Reference to the user-to-user chat this message belongs to
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserToUserChat',
        required: true
    },

    // Message sender - a user
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
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
    collection: 'user_to_user_messages'
});

// Indexes for efficient queries
userToUserMessageSchema.index({ chatId: 1, createdAt: 1 }); // For fetching messages in chat order
userToUserMessageSchema.index({ senderId: 1, createdAt: -1 }); // For user message history
userToUserMessageSchema.index({ chatId: 1, senderId: 1, createdAt: -1 }); // For last message queries

module.exports = Chats.model('UserToUserMessage', userToUserMessageSchema);
