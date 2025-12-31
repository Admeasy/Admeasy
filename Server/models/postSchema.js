const mongoose = require('mongoose');
const { Admeasy } = require('../db');

/**
 * Unified Post Schema
 * Supports both Users and Mentors as authors
 * Reddit-style interactions: votes, comments, reposts
 */
const postSchema = new mongoose.Schema(
  {
    // Polymorphic author reference
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    // Author type: 'User' or 'Mentor'
    // Used with refPath for polymorphic population
    authorType: {
      type: String,
      required: true,
      enum: ['User', 'Mentor'],
      index: true,
    },
    // Post content
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000, // Reasonable limit
    },
    // Image URL (Cloudinary)
    image: {
      type: String,
      default: null,
    },
    // External link preview (for shared links)
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
    // Repost reference (if this is a repost)
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
      index: true,
    },
    // Aggregated vote score (upvotes - downvotes)
    // Updated atomically via Vote model hooks
    voteScore: {
      type: Number,
      default: 0,
      index: true,
    },
    // Aggregated counts (updated via hooks)
    commentCount: {
      type: Number,
      default: 0,
      index: true,
    },
    repostCount: {
      type: Number,
      default: 0,
      index: true,
    },
    // Soft delete flag
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
// Feed query: non-deleted posts, sorted by voteScore or createdAt
postSchema.index({ deleted: 1, createdAt: -1 });
postSchema.index({ deleted: 1, voteScore: -1, createdAt: -1 });
// Author queries
postSchema.index({ author: 1, authorType: 1, createdAt: -1 });
// Repost queries
postSchema.index({ repostOf: 1, createdAt: -1 });

// Virtual for polymorphic population
// Note: We'll handle population manually in controllers to avoid cross-DB issues
postSchema.virtual('authorRef', {
  refPath: 'authorType',
  localField: 'author',
  foreignField: '_id',
});

// Ensure model is registered correctly
// Check if model already exists to avoid re-registration errors
let Post;
try {
  Post = Admeasy.model('Post');
} catch (error) {
  Post = Admeasy.model('Post', postSchema);
}

module.exports = Post;




