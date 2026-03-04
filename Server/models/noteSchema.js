const mongoose = require('mongoose');
const {Admeasy} = require('../db')
const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  standard: {
    type: String,
    required: true,
    trim: true
  },
  pages: {
    type: Number,
    min: 1
  },
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    min: 0
  },
  university: {
    type: String,
    required: true,
    trim: true
  },
  programme: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  tags: {
    type: String,
    trim: true
  },
  hashtags: [{          // NEW: Array of strings for hashtags
    type: String,
    trim: true
  }],
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  cloudinaryPublicId: String, 

  // OPTIONAL PREVIEW IMAGE (IF NOT PROVIDED, SHOW PDF PREVIEW PAGES)
  previewImages: {
    type: [String],
    default: []
  },

  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true
  },
  uploaderName: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for search
noteSchema.index({
  title: 'text',
  description: 'text',
  uploaderName: 'text',
  tags: 'text',
  hashtags: 1
});

module.exports = Admeasy.model('Note', noteSchema);