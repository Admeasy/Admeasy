const mongoose = require("mongoose");
const { Admeasy } = require("../db");

const mentorActivityLogSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      enum: [
        "login",
        "profile_updated",
        "message_sent",
        "note_uploaded",
        "student_subscribed",
        "chat_responded",
        "chat_ignored",
      ],
      required: true,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Compound index for admin queries: filter by mentor + time range
mentorActivityLogSchema.index({ mentorId: 1, createdAt: -1 });
// Index for finding inactive mentors (query by eventType + createdAt)
mentorActivityLogSchema.index({ createdAt: -1 });

const MentorActivityLog = Admeasy.model(
  "MentorActivityLog",
  mentorActivityLogSchema,
);

module.exports = MentorActivityLog;
