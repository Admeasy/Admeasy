const mongoose = require('mongoose');
const { Users } = require('../db');

/**
 * UserKeywordAffinity Schema
 * Tracks keywords extracted from posts that users have engaged with
 * Used to personalize feed by showing more posts with similar keywords
 * 
 * Example:
 * - User likes a post about "CUET 2026" → keyword "CUET 2026" gets +1 weight
 * - User comments on post about "SRCC" → keyword "SRCC" gets +1 weight
 * - Future feed prioritizes posts containing these keywords
 */
const userKeywordAffinitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    // Weight increases with each engagement
    // Higher weight = stronger affinity = higher priority in feed
    weight: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Track when keyword was first added and last updated
    firstEngagedAt: {
      type: Date,
      default: Date.now,
    },
    lastEngagedAt: {
      type: Date,
      default: Date.now,
    },
    // Count of engagements that contributed to this keyword
    engagementCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient keyword lookups
userKeywordAffinitySchema.index({ userId: 1, keyword: 1 }, { unique: true });
userKeywordAffinitySchema.index({ userId: 1, weight: -1 }); // For sorting by affinity strength

/**
 * Increment weight when user engages with content containing this keyword
 */
userKeywordAffinitySchema.methods.incrementWeight = function() {
  this.weight += 1;
  this.engagementCount += 1;
  this.lastEngagedAt = new Date();
};

module.exports = Users.model('UserKeywordAffinity', userKeywordAffinitySchema);
