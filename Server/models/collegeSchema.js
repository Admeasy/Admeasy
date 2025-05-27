const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  establishedYear: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Public', 'Private'],
    required: true
  },
  coursesOffered: [{
    type: String,
    required: true
  }],
  website: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  contact: {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  childDocs: {
    coursesId: {
      type: String,
      required: true,
      trim: true
    },
    scholarshipsId: {
      type: String,
      required: true,
      trim: true
    },
    galleryId: {
      type: String,
      required: true,
      trim: true
    },
    videoReviewsId: {
      type: String,
      required: true,
      trim: true
    }
  }
});

module.exports = mongoose.model('College', collegeSchema);