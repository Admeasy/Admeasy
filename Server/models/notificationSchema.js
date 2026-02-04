const mongoose = require("mongoose");
const { Admeasy } = require("../db");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["user", "mentor"],
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "FOLLOW",
        "FOLLOW_BACK",
        "MESSAGE",
        "POST_LIKE",
        "COMMENT_LIKE",
        "COMMENT",
        "REPOST",
        "FOLLOWING_POST",
        "MENTION",
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: ["USER", "POST", "COMMENT", "MESSAGE"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    originPath: {
      type: String,
      required: true, // e.g., "/post/123", "/profile/456", "/chat/789"
    },
    message: {
      type: String,
      required: true, // Display text
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
notificationSchema.index({ recipientId: 1, recipientRole: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, recipientRole: 1, isRead: 1 });
notificationSchema.index({ actorId: 1, entityType: 1, entityId: 1 }); // Prevent duplicates

module.exports = Admeasy.model("Notification", notificationSchema);
