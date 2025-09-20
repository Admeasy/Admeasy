const mongoose = require('mongoose')
const {Applications} = require('../db')

const BlogSchema = new mongoose.Schema(
  {
    Author: {
      type: String,
      required: true,
      trim: true,
    },
    Title: {
      type: String,
      required: true,
      trim: true,
    },
    Thumbnail: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    category:{
      type: String,
      required: true
    },
    readingTime:{
      type:Number,
      required:true
    },

    // custom "by" fields
    createdBy: {
      type: String, 
      required: false,
    },
    updatedBy: {
      type: String,
      required: false,
    },
  },
  {
    timestamps:true
});

// middleware to update "updatedBy" automatically
BlogSchema.pre("save", function (next) {
  if (this.isModified()) {
    this.updatedBy = this._updatedBy; // you can pass this manually in controller
  }
  next();
});

module.exports = Applications.model("Blog", BlogSchema);