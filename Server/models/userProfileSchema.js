const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schools',
      default: null,
    },
    schoolName: {
      type: String,
      default: null,
      trim: true,
    },
    schoolRole: {
      type: String,
      enum: ['student'],
      default: null, // 'student' when user has joined a school
    },
    city: {
      type: String,
      default: null,
      trim: true,
    },
    class: {
      type: String,
      default: null,
      trim: true,
    },
    board: {
      type: String,
      default: null,
      trim: true,
    },
    exams: {
      type: [String],
      default: [],
    },
    topTags: {
      type: [String],
      default: [],
    },
    examInterests: {
      type: [String],
      default: [],
    },
    subjectInterests: {
      type: [String],
      default: [],
    },
    careerInterests: {
      type: [String],
      default: [],
    },
    likedPosts: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    openedNotes: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    followedMentors: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    joinedSpaces: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    searchHistory: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true, collection: 'user_profiles' }
);

module.exports = Admeasy.models.UserProfile || Admeasy.model('UserProfile', userProfileSchema);
