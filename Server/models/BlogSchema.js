const mongoose = require('mongoose');
const { Applications } = require('../db');

const blogSchema = new mongoose.Schema(
  {
    Author: {
      type: String,
      required: true,
      trim: true,
    },
    Title: {
      type: String,
      required: true,
      trim: true,
    },
    Thumbnail: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    hashtags: [{          // NEW: Array of strings for hashtags
      type: String,
      trim: true
    }],
    readingTime: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: String,  // Changed from ObjectId to String
      required: false,
    },
    updatedBy: {
      type: String,  // Changed from ObjectId to String
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.index({ hashtags: 1 }); // NEW: Index for fast hashtag filtering
module.exports = Applications.models.Blogs || Applications.model("Blogs", blogSchema);