const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  razorpayOrderId: {
  type: String,
  required: false
  },
  razorpayPaymentId: {
    type: String,
    required: false
  },
  razorpaySignature: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one purchase per user per note
// paymentSchema.index({ user: 1, note: 1 }, { unique: true });

// Add a compound index that includes status
paymentSchema.index({ user: 1, note: 1, status: 1 });

// Add a unique index on razorpayOrderId when it exists
paymentSchema.index({ razorpayOrderId: 1 }, { 
  unique: true, 
  sparse: true // Only enforce uniqueness when the field exists
});

module.exports = mongoose.model('Payment', paymentSchema);
