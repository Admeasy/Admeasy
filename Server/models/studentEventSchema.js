const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const studentEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    categoryTags: {
      type: Map,
      of: [String],
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    dedupeWindowBucket: {
      type: Number,
      default: null,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true, collection: 'student_events' }
);

studentEventSchema.index({ userId: 1, eventType: 1, tags: 1, timestamp: -1 });
studentEventSchema.index(
  { userId: 1, eventType: 1, entityId: 1, dedupeWindowBucket: 1 },
  { unique: true, partialFilterExpression: { dedupeWindowBucket: { $ne: null } } }
);

module.exports = Admeasy.models.StudentEvent || Admeasy.model('StudentEvent', studentEventSchema);
