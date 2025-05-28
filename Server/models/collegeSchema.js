const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  desc: {
    type: String,
    trim: true,
  },
  logo: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  location: {
    type: String,
    trim: true
  },
  establishedYear: {
    type: Number,
  },
  type: {
    type: String,
    enum: ['Public', 'Private'],
  },
  coursesOffered: [{
    type: String,
  }],
  website: {
    type: String,

    trim: true,
    lowercase: true
  },
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  childDocs: {
    coursesId: {
      type: String,
      trim: true
    },
    scholarshipsId: {
      type: String,
      trim: true
    },
    galleryId: {
      type: String,
      trim: true
    },
    videoReviewsId: {
      type: String,
      trim: true
    }
  }
});

module.exports = mongoose.model('College', collegeSchema);