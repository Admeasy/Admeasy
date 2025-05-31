const mongoose = require('mongoose');

const CollegesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  desc: {
    type: String,
    required: true,
    trim: true,
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
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Public', 'Private'],
  },
  coursesOffered: [{
    type: String,
    required: true,
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
  keywords: [{
    type: String,
    trim: true
  }],
  package: {
    average: {
      type: String,
      required: true,
      trim: true
    },
    highest: {
      type: String,
      required: true,
      trim: true
    }
  },
  recruiters: {
    type: [{
      type: String,
      required: true,
      trim: true
    }]
  },
  placementRate: {
    type: String,
    required: true,
    trim: true
  },
  childDocs: {
    coursesId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Courses'
    },
    scholarshipsId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Scholarships'
    },
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery'
    }
  }
});

module.exports = mongoose.model('Colleges', CollegesSchema);