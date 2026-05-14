const mongoose = require("mongoose");
const { Admeasy } = require("../db");

const CuetDiscussionSchema = new mongoose.Schema({

  _id: {
    type: String,
    default: () =>
      new mongoose.Types.ObjectId().toString()
  },

  // -----------------------------------
  // PAGE CONTEXT
  // -----------------------------------

  page: {
    type: String,
    default: "cuet-calculator",
    index: true
  },

  course: {
    type: String,
    trim: true,
    default: null,
    index: true
  },

  stream: {
    type: String,
    default: null,
    index: true
  },

  category: {
    type: String,
    default: null,
    index: true
  },

  score: {
    type: Number,
    default: null
  },

  // -----------------------------------
  // COMMENT TYPE
  // -----------------------------------

  type: {
    type: String,
    enum: [
      "comment",
      "reply"
    ],
    default: "comment",
    index: true
  },

  parentCommentId: {
    type: String,
    default: null,
    index: true
  },

  // -----------------------------------
  // USER DATA
  // -----------------------------------

  userId: {
    type: String,
    default: null,
    index: true
  },

  userModel: {
    type: String,
    enum: [
      "Users",
      "Mentors"
    ],
    default: "Users"
  },

  role: {
    type: String,
    enum: [
      "guest",
      "student",
      "mentor"
    ],
    default: "guest",
    index: true
  },

  isAnonymous: {
    type: Boolean,
    default: true
  },

  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },

  username: {
    type: String,
    trim: true,
    default: null
  },

  avatar: {
    type: String,
    trim: true
  },

  collegeName: {
    type: String,
    trim: true
  },

  badge: {
    type: String,
    trim: true
  },

  // -----------------------------------
  // COMMENT CONTENT
  // -----------------------------------

  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 1200
  },

  mentions: [{
    type: String
  }],

  // -----------------------------------
  // ENGAGEMENT
  // -----------------------------------

  likesCount: {
    type: Number,
    default: 0,
    index: true
  },

  likedBy: [{
    userId: String
  }],

  repliesCount: {
    type: Number,
    default: 0
  },

  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // -----------------------------------
  // MODERATION
  // -----------------------------------

  status: {
    type: String,
    enum: [
      "visible",
      "hidden",
      "flagged",
      "deleted"
    ],
    default: "visible",
    index: true
  },

  reportsCount: {
    type: Number,
    default: 0
  },

  moderationReason: {
    type: String,
    trim: true
  },

  isEdited: {
    type: Boolean,
    default: false
  },

  editedAt: {
    type: Date
  },

  deletedAt: {
    type: Date
  },

  isPinned: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// -----------------------------------
// INDEXES
// -----------------------------------

CuetDiscussionSchema.index({
  page: 1,
  createdAt: -1
});

CuetDiscussionSchema.index({
  page: 1,
  course: 1,
  createdAt: -1
});

CuetDiscussionSchema.index({
  parentCommentId: 1,
  createdAt: -1
});

CuetDiscussionSchema.index({
  stream: 1,
  category: 1
});

module.exports = Admeasy.model(
  "CuetDiscussions",
  CuetDiscussionSchema
);