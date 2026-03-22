const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const schoolSchema = new mongoose.Schema(
  {
    schoolCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{2}\d{5}$/, // AA00001 format
    },
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    board: {
      type: String,
      trim: true,
      default: '',
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: 'schools',
  }
);

// schoolCode has unique: true which creates index automatically

module.exports = Admeasy.models.Schools || Admeasy.model('Schools', schoolSchema);
