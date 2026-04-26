const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const externalLinkSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      default: null,
    },
    preview: {
      title: {
        type: String,
        trim: true,
        default: null,
      },
      description: {
        type: String,
        trim: true,
        default: null,
      },
      favicon: {
        type: String,
        default: null,
      },
      image: {
        type: String,
        default: null,
      },
      domain: {
        type: String,
        trim: true,
        default: null,
      },
      platform: {
        type: String,
        enum: ['youtube', 'website', 'other'],
        default: 'website',
      },
    },
  },
  { _id: false }
);

const memberSnapshotSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'mentor', 'teacher'],
      required: true,
    },
    username: {
      type: String,
      trim: true,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    author: {
      type: memberSnapshotSchema,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // Cloudinary URL
      default: null,
    },
    externalLink: {
      type: externalLinkSchema,
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId, // references another message _id within this space
      default: null,
    },
    likes: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        role: {
          type: String,
          enum: ['user', 'mentor'],
          required: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String, // Cloudinary URL
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    creator: {
      type: memberSnapshotSchema,
      required: true,
    },
    type: {
      type: String,
      enum: ['public', 'private', 'school'],
      default: 'public',
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schools',
      default: null,
    },
    isJoinApprovalRequired: {
      type: Boolean,
      default: false,
    },
    isPostingRestricted: {
      type: Boolean,
      default: false, // false = free flow (WhatsApp style), true = admin only
    },
    allowedRoles: {
      type: [String],
      default: [], // e.g. ['student', 'teacher'] - empty means all
    },
    members: {
      type: [memberSnapshotSchema],
      default: [],
    },
    moderators: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [], // user/mentor/teacher IDs who can approve, moderate
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'spaces', // explicitly use 'spaces' collection inside Admeasy DB
  }
);

// Indexes for efficient queries
spaceSchema.index({ 'members.id': 1, updatedAt: -1 });
spaceSchema.index({ createdAt: -1 });
spaceSchema.index({ name: 'text', description: 'text' });
spaceSchema.index({ type: 1 });
spaceSchema.index({ schoolId: 1 });

const Space = Admeasy.models.Space || Admeasy.model('Space', spaceSchema);

// Keep legacy alias if any part of the app still references the old model name
if (!Admeasy.models.Spaces) {
  Admeasy.model('Spaces', spaceSchema);
}

module.exports = Space;

