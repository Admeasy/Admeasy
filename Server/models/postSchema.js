const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const postSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor', // Fixed: Changed from 'Mentors' to 'Mentor' to match model registration
      required: false, // Made optional to support user posts
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: false, // Made optional to support mentor posts
    },
    // headline: Optional for new posts; null for old posts (handle in rendering layer)
    headline: {
      type: String,
      default: null,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // category: 'study' | 'masti'. Defaults to 'study' for all existing posts.
    category: {
      type: String,
      enum: ['study', 'masti'],
      default: 'study',
    },
    // spaceId: Optional. Not required for old posts.
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      default: null,
    },
    hashtags: [{          // NEW: Array of strings for hashtags
      type: String,
      trim: true,
    }],
    image: {
      type: String, // Cloudinary URL
      default: null,
    },
    images: [{
      type: String,
    }],
    externalLink: {
      url: {
        type: String,
        trim: true,
        default: null,
      },
      preview: {
        title: {
          type: String,
          trim: true,
          default: null,
        },
        description: {
          type: String,
          trim: true,
          default: null,
        },
        favicon: {
          type: String,
          default: null,
        },
        image: {
          type: String,
          default: null,
        },
        domain: {
          type: String,
          trim: true,
          default: null,
        },
        platform: {
          type: String,
          enum: ['youtube', 'website', 'other'],
          default: 'website',
        },
      },
    },
    likes: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    likesCount: {
      type: Number,
      default: 0,
    },
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
      },
      content: {
        type: String,
        required: true,
        trim: true,
      },
      likes: [{
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Users',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }],
      likesCount: {
        type: Number,
        default: 0,
      },
      parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      deleted: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    commentsCount: {
      type: Number,
      default: 0,
    },
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Posts',
      default: null,
    },
    repostCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: At least one of mentorId or userId must be present
postSchema.pre('validate', function(next) {
  if (!this.mentorId && !this.userId) {
    return next(new Error('Either mentorId or userId must be provided'));
  }
  if (this.mentorId && this.userId) {
    return next(new Error('Post cannot have both mentorId and userId'));
  }
  next();
});

// Indexes for efficient queries
postSchema.index({ hashtags: 1 });
postSchema.index({ mentorId: 1, createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'comments.deleted': 1, 'comments.createdAt': 1 });
postSchema.index({ 'comments.parentCommentId': 1 });
// Compound index for feed queries
postSchema.index({ createdAt: -1, likesCount: -1 });
// Index for dual-channel feed filtering
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ spaceId: 1, createdAt: -1 });

module.exports = Admeasy.models.PPosts || Admeasy.model('Posts', postSchema);

