const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const teacherSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schools',
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      default: null, // null until teacher sets password via invite
      select: false,
    },
    assignedSpaces: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Spaces',
      default: [],
    },
    role: {
      type: String,
      enum: ['admin', 'teacher'],
      default: 'teacher',
    },
    inviteToken: {
      type: String,
      default: null,
      select: false,
    },
    inviteTokenExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'teachers',
  }
);

teacherSchema.index({ schoolId: 1, email: 1 }, { unique: true });
teacherSchema.index({ inviteToken: 1 });

module.exports = Admeasy.models.Teachers || Admeasy.model('Teachers', teacherSchema);
