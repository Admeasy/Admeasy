const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const CuetCutoffSchema = new mongoose.Schema({

  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },

  year: {
    type: Number,
    required: true,
    index: true
  },

  university: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  collegeId: {
    type: String,
    ref: 'Colleges',
    index: true
  },

  collegeName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  course: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  category: {
    type: String,
    required: true,
    enum: [
      'GENERAL',
      'OBC',
      'SC',
      'ST',
      'EWS',
      'PWBD'
    ],
    index: true
  },

  round: {
    type: Number,
    required: true,
    default: 1
  },

  gender: {
    type: String,
    enum: ['ALL', 'MALE', 'FEMALE'],
    default: 'ALL'
  },

  quota: {
    type: String,
    default: 'AIQ'
  },

  stream: {
    type: String,
    enum: [
      'Commerce',
      'Science',
      'Arts'
    ],
    index: true
  },

  maxMarks: {
    type: Number,
    default: 800
  },

  closingScore: {
    type: Number,
    required: true,
    index: true
  },

  closingPercentile: {
    type: Number
  },

  seats: {
    type: Number
  },

  source: {
    type: {
      type: String,
      enum: ['official', 'manual'],
      default: 'official'
    },

    url: {
      type: String,
      trim: true
    }
  }

}, {
  timestamps: true
});

CuetCutoffSchema.index({
  year: 1,
  category: 1,
  course: 1,
  closingScore: -1
});


module.exports = Admeasy.model(
  'CuetCutoffs',
  CuetCutoffSchema
);