const mongoose = require('mongoose');

const CollegesSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    trim: true,
    default: new mongoose.Types.ObjectId().toString()
  },
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
    overall: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    educationalQuality: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    faculty: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    infrastructure: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    placements: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    facilities: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    }
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
    introDesc: {
      type: String,
      required: true
    },
    desc: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    semesters: {
      type: Number,
      required: true
    },
    rating: {
      type: Number,
      required: true
    },
    eligibility: {
      type: String,
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
    },
    scholarships: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      eligibilityCriteria: {
        type: String,
        required: true,
        trim: true
      },
      benefit: {
        type: String,
        required: true,
        trim: true
      },
      howToApply: {
        type: String,
        required: true,
        trim: true
      }
    }]
  }],
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
  gallery: {
    type: String,
    required: true,
    trim: true
  },
  moreInfo: {
    type: Map,
    of: String,
    default: {}
  },
  whyChoose: [{
    type: String,
    required: true,
    trim: true
  }]
});

module.exports = mongoose.model('Colleges', CollegesSchema);