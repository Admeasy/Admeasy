const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const mentorPostSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor', // Fixed: Changed from 'Mentors' to 'Mentor' to match model registration
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // Cloudinary URL
      default: null,
    },
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
      ref: 'MentorPosts',
      default: null,
    },
    repostCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
mentorPostSchema.index({ mentorId: 1, createdAt: -1 });
mentorPostSchema.index({ createdAt: -1 });
mentorPostSchema.index({ 'comments.deleted': 1, 'comments.createdAt': 1 });
mentorPostSchema.index({ 'comments.parentCommentId': 1 });
// Compound index for feed queries
mentorPostSchema.index({ createdAt: -1, likesCount: -1 });

module.exports = Admeasy.models.MentorPosts || Admeasy.model('MentorPosts', mentorPostSchema);

