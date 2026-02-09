const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const advertiserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  image: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes (unique indexes are created automatically by unique: true)
advertiserSchema.index({ createdAt: -1 });

module.exports = Admeasy.models.Advertisers || Admeasy.model('Advertisers', advertiserSchema);
