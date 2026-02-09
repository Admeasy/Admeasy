const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const adSchema = new mongoose.Schema({
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
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  views: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  viewsCount: {
    type: Number,
    default: 0
  },
  clicks: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor'
    },
    clickedAt: {
      type: Date,
      default: Date.now
    }
  }],
  clicksCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'live'],
    default: 'pending'
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
adSchema.index({ advertiserId: 1, createdAt: -1 });
adSchema.index({ status: 1, createdAt: -1 });
adSchema.index({ createdAt: -1 });
adSchema.index({ viewsCount: -1 });
adSchema.index({ clicksCount: -1 });
adSchema.index({ likesCount: -1 });

module.exports = Admeasy.models.Ads || Admeasy.model('Ads', adSchema);
