const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const adRequestSchema = new mongoose.Schema({
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisers',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  externalLink: {
    url: {
      type: String,
      required: true,
      trim: true
    },
    linkText: {
      type: String,
      trim: true,
      default: null
    },
    preview: {
      title: {
        type: String,
        trim: true,
        default: null
      },
      description: {
        type: String,
        trim: true,
        default: null
      },
      favicon: {
        type: String,
        default: null
      },
      image: {
        type: String,
        default: null
      },
      domain: {
        type: String,
        trim: true,
        default: null
      },
      platform: {
        type: String,
        enum: ['youtube', 'website', 'other'],
        default: 'website'
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: String,
    default: null // Admin username or ID
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
adRequestSchema.index({ advertiserId: 1, createdAt: -1 });
adRequestSchema.index({ status: 1, createdAt: -1 });
adRequestSchema.index({ createdAt: -1 });

module.exports = Admeasy.models.AdRequests || Admeasy.model('AdRequests', adRequestSchema);
