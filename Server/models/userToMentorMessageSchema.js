const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const userToMentorMessageSchema = new mongoose.Schema({
    // Reference to the user-to-mentor chat this message belongs to
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserToMentorChat',
        required: true
    },

    // Message sender - either user or mentor
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // Could be from Users or Mentors collection
    },
    senderRole: {
        type: String,
        enum: ['user', 'mentor'],
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
    collection: 'chat_messages'
});

// Indexes for efficient queries
userToMentorMessageSchema.index({ chatId: 1, createdAt: 1 }); // For fetching messages in chat order
userToMentorMessageSchema.index({ senderId: 1, createdAt: -1 }); // For user/mentor message history
userToMentorMessageSchema.index({ chatId: 1, senderId: 1, createdAt: -1 }); // For last message queries

// Pre-save middleware to validate sender exists in appropriate collection
userToMentorMessageSchema.pre('save', async function(next) {
    try {
        const Model = this.senderRole === 'user'
            ? require('./userSchema')
            : require('./mentorSchema');

        const sender = await Model.findById(this.senderId);
        if (!sender) {
            return next(new Error(`Sender ${this.senderRole} not found`));
        }

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = Admeasy.model('UserToMentorMessage', userToMentorMessageSchema);
