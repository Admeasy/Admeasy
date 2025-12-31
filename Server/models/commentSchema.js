const mongoose = require('mongoose');
const { Admeasy } = require('../db');

/**
 * Comment Schema
 * Separate collection for comments (scalable)
 * Supports nested comments via parentComment
 * Supports both Users and Mentors as commenters
 */
const commentSchema = new mongoose.Schema(
  {
    // Post being commented on
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    // Commenter (can be User or Mentor)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    // Author type for polymorphic reference
    authorType: {
      type: String,
      required: true,
      enum: ['User', 'Mentor'],
      index: true,
    },
    // Comment content
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    // Parent comment (for nested replies)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    // Soft delete
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
// Post comments (top-level, sorted by createdAt)
commentSchema.index({ post: 1, parentComment: null, deleted: 1, createdAt: 1 });
// Nested replies
commentSchema.index({ parentComment: 1, deleted: 1, createdAt: 1 });
// Author's comments
commentSchema.index({ author: 1, authorType: 1, createdAt: -1 });

/**
 * Middleware: Update Post.commentCount when comment is created/deleted
 */
commentSchema.post('save', async function () {
  if (!this.deleted) {
    await updatePostCommentCount(this.post);
  }
});

commentSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await updatePostCommentCount(doc.post);
  }
});

commentSchema.post('deleteOne', async function () {
  const postId = this.getQuery().post;
  if (postId) {
    await updatePostCommentCount(postId);
  }
});

// Also handle soft deletes
commentSchema.post('findOneAndUpdate', async function (doc) {
  if (doc && doc.deleted !== undefined) {
    await updatePostCommentCount(doc.post);
  }
});

/**
 * Atomic comment count update
 * Counts all non-deleted comments for a post
 */
async function updatePostCommentCount(postId) {
  try {
    const Post = require('./postSchema');
    const Comment = Admeasy.model('Comment');
    
    const count = await Comment.countDocuments({
      post: postId,
      deleted: false,
    });
    
    await Post.findByIdAndUpdate(postId, { commentCount: count }, { new: true });
  } catch (error) {
    console.error('Error updating comment count:', error);
  }
}

// Ensure model is registered correctly
let Comment;
try {
  Comment = Admeasy.model('Comment');
} catch (error) {
  Comment = Admeasy.model('Comment', commentSchema);
}

module.exports = Comment;


