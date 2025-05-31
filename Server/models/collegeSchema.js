const mongoose = require('mongoose');

const CollegesSchema = new mongoose.Schema({
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
  keywords: [{
    type: String,
    trim: true
  }],
  childDocs: {
    coursesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Courses'
    },
    scholarshipsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scholarships'
    },
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery'
    },
    videoReviewsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VidReviews'
    }
  }
});

module.exports = mongoose.model('Colleges', CollegesSchema);