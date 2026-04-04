const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const masterTagSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
  },
  { timestamps: true, collection: 'master_tags' }
);

masterTagSchema.index({ aliases: 1 });

module.exports = Admeasy.models.MasterTag || Admeasy.model('MasterTag', masterTagSchema);
