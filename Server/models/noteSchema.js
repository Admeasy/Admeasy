const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const previewSchema = new mongoose.Schema(
  {
    pageNumber: {
      type: Number,
      min: 1,
    },
    previewUrl: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    uploaderName: {
      type: String,
      required: true,
      trim: true,
    },
    uploaderAvatar: {
      type: String,
      trim: true,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    university: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    programme: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    standard: {
      type: String,
      trim: true,
    },
    pages: {
      type: Number,
      min: 1,
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    previewPages: {
      type: [previewSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Admeasy.models.Note || Admeasy.model('Note', noteSchema);