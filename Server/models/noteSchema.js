const mongoose = require("mongoose");
const { Admeasy } = require("../db");
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    standard: {
      type: String,
      required: true,
      trim: true,
    },
    pages: {
      type: Number,
      min: 1,
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    schoolNotes: {
      type: Boolean,
      default: false,
    },
    university: {
      type: String,
      trim: true,
      required: function () {
        return !this.schoolNotes;
      },
    },
    programme: {
      type: String,
      trim: true,
      required: function () {
        return !this.schoolNotes;
      },
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: String,
      trim: true,
    },
    hashtags: [
      {
        // NEW: Array of strings for hashtags
        type: String,
        trim: true,
      },
    ],
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    cloudinaryPublicId: String,

    // OPTIONAL PREVIEW IMAGE (IF NOT PROVIDED, SHOW PDF PREVIEW PAGES)
    previewImages: {
      type: [String],
      default: [],
    },

    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "uploaderModel", // NEW: Dynamic reference
    },
    uploaderModel: {
      // NEW: Identifies if it's a User or Mentor
      type: String,
      required: true,
      enum: ["Mentor", "User"],
      default: "Mentor", // Default to Mentor so old notes don't break
    },
    uploaderName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    likes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
    extractedText: {
      type: String,
    },
    aiSummary: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Index for search
noteSchema.index({
  title: "text",
  description: "text",
  uploaderName: "text",
  tags: "text",
  hashtags: 1,
});

module.exports = Admeasy.model("Note", noteSchema);
