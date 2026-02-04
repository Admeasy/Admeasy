const mongoose = require('mongoose');
const { Users } = require('../db');

/**
 * PostView Schema
 * Tracks user-post interaction states: UNSEEN, SEEN, ENGAGED
 * 
 * State Progression:
 * - UNSEEN: Default state, post has never been viewed
 * - SEEN: Post entered viewport and stayed visible ≥ 1000ms with ≥ 50% visibility
 * - ENGAGED: User liked, commented, saved, shared, or reposted
 * 
 * Important: States can only upgrade (UNSEEN → SEEN → ENGAGED), never downgrade
 */
const postViewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Posts',
      required: true,
      index: true,
    },
    state: {
      type: String,
      enum: ['UNSEEN', 'SEEN', 'ENGAGED'],
      default: 'UNSEEN',
      required: true,
      index: true,
    },
    // View tracking data (only set when state is SEEN or ENGAGED)
    firstSeenAt: {
      type: Date,
      default: null,
    },
    viewDuration: {
      type: Number, // milliseconds
      default: 0,
    },
    viewportPercentage: {
      type: Number, // 0-100
      default: 0,
    },
    // Engagement tracking
    engagedAt: {
      type: Date,
      default: null,
    },
    engagementType: {
      type: String,
      enum: ['like', 'comment', 'save', 'share', 'repost'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient feed queries
// Used to fetch UNSEEN posts for a user, or SEEN but not ENGAGED
postViewSchema.index({ userId: 1, state: 1, postId: 1 });
postViewSchema.index({ userId: 1, postId: 1 }, { unique: true }); // One view record per user-post pair

/**
 * Upgrade state (only allows progression: UNSEEN → SEEN → ENGAGED)
 * @param {String} newState - Target state
 * @param {Object} data - Additional data for the state
 */
postViewSchema.methods.upgradeState = function(newState, data = {}) {
  const stateOrder = { UNSEEN: 0, SEEN: 1, ENGAGED: 2 };
  const currentOrder = stateOrder[this.state] || 0;
  const newOrder = stateOrder[newState] || 0;

  // Only allow state progression, never regression
  if (newOrder > currentOrder) {
    this.state = newState;

    if (newState === 'SEEN') {
      this.firstSeenAt = data.firstSeenAt || new Date();
      this.viewDuration = data.viewDuration || 0;
      this.viewportPercentage = data.viewportPercentage || 0;
    } else if (newState === 'ENGAGED') {
      this.engagedAt = data.engagedAt || new Date();
      this.engagementType = data.engagementType || null;
      // If not already SEEN, mark as SEEN first
      if (currentOrder === 0) {
        this.firstSeenAt = this.engagedAt;
      }
    }
  }
};

module.exports = Users.model('PostView', postViewSchema);
