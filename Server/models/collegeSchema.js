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
  courses: [{
    title: {
      type: String,
      required: true
    },
    desc: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    semesters: {
      type: Number,
      required: true
    },
    feeStructure: {
      feePerSemester: {
        type: Number,
        required: true
      },
      additionals: {
        type: Map,
        of: Number,
        default: {}
      }
    }
  }, { _id: false }],
  facilities: [{
    type: String,
    required: true,
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
  scholarships: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    eligibilityCriteria: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: String,
      required: true,
      trim: true
    }
  }, { _id: false }],
  gallery: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model('Colleges', CollegesSchema);