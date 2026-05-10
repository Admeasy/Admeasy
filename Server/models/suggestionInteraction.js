/**
 * models/suggestionInteraction.js
 *
 * Tracks the full funnel for each student-mentor suggestion pair.
 * One record per (studentId, mentorId) pair — upserted as events occur.
 *
 * Must use Admeasy.model() per project DB connection rules.
 */

const mongoose = require("mongoose");
const { Admeasy } = require("../db");

const suggestionInteractionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
      index: true,
    },

    // Funnel timestamps — set once, never overwritten
    suggestedAt: {
      type: Date,
      default: null,
    },
    profileViewedAt: {
      type: Date,
      default: null,
    },
    followedAt: {
      type: Date,
      default: null,
    },
    chatInitiatedAt: {
      type: Date,
      default: null,
    },
    mentorRespondedAt: {
      type: Date,
      default: null,
    },
    subscribedAt: {
      type: Date,
      default: null,
    },

    outcome: {
      type: String,
      enum: ["pending", "engaged", "subscribed", "dropped"],
      default: "pending",
    },

    dropReason: {
      type: String,
      enum: ["no_mentor_response", "no_student_followup", null],
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  },
);

// Compound unique index — one record per student-mentor pair
suggestionInteractionSchema.index(
  { studentId: 1, mentorId: 1 },
  { unique: true },
);

// Index for drop detection cron (finds records where chat started but no mentor reply)
suggestionInteractionSchema.index({
  chatInitiatedAt: 1,
  mentorRespondedAt: 1,
  outcome: 1,
});

// Index for admin funnel queries
suggestionInteractionSchema.index({ mentorId: 1, outcome: 1 });

const SuggestionInteraction = Admeasy.model(
  "SuggestionInteraction",
  suggestionInteractionSchema,
);

module.exports = SuggestionInteraction;
