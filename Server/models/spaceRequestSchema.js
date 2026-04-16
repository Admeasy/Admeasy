const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const spaceRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Spaces',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // Can be teacher, user, or mentor (space owner/moderator)
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'space_requests',
  }
);

spaceRequestSchema.index({ userId: 1, spaceId: 1 }, { unique: true });
spaceRequestSchema.index({ spaceId: 1, status: 1 });

module.exports = Admeasy.models.SpaceRequests || Admeasy.model('SpaceRequests', spaceRequestSchema);
