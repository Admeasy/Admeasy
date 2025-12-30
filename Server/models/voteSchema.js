const mongoose = require('mongoose');
const { Admeasy, Users } = require('../db');

/**
 * Vote Schema
 * Separate collection for votes (scalable)
 * Supports upvote (+1) and downvote (-1)
 * Enforces one vote per user per post
 */
const voteSchema = new mongoose.Schema(
  {
    // Post being voted on
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    // Voter (can be User or Mentor)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    // User type for cross-DB reference handling
    userType: {
      type: String,
      required: true,
      enum: ['User', 'Mentor'],
      index: true,
    },
    // Vote value: 1 (upvote) or -1 (downvote)
    value: {
      type: Number,
      required: true,
      enum: [1, -1],
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one vote per user per post
voteSchema.index({ post: 1, user: 1, userType: 1 }, { unique: true });

// Index for user's vote history
voteSchema.index({ user: 1, userType: 1, createdAt: -1 });

// Index for post vote queries
voteSchema.index({ post: 1, value: 1 });

/**
 * Middleware: Update Post.voteScore when vote is created/updated/deleted
 * Uses atomic operations to prevent race conditions
 */
voteSchema.post('save', async function () {
  await updatePostVoteScore(this.post);
});

voteSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await updatePostVoteScore(doc.post);
  }
});

voteSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await updatePostVoteScore(doc.post);
  }
});

voteSchema.post('deleteOne', async function () {
  // Get the post ID from the query
  const postId = this.getQuery().post;
  if (postId) {
    await updatePostVoteScore(postId);
  }
});

/**
 * Atomic vote score update
 * Calculates sum of all votes for a post
 */
async function updatePostVoteScore(postId) {
  try {
    const Post = require('./postSchema');
    const Vote = Admeasy.model('Vote');
    
    // Aggregate sum of all votes for this post
    const result = await Vote.aggregate([
      { $match: { post: postId } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    
    const voteScore = result.length > 0 ? result[0].total : 0;
    
    // Atomic update
    await Post.findByIdAndUpdate(postId, { voteScore }, { new: true });
  } catch (error) {
    console.error('Error updating vote score:', error);
    // Don't throw - vote is saved, score will sync eventually
  }
}

// Ensure model is registered correctly
let Vote;
try {
  Vote = Admeasy.model('Vote');
} catch (error) {
  Vote = Admeasy.model('Vote', voteSchema);
}

module.exports = Vote;

