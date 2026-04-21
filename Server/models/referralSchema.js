const { Users } = require("../db.js");
const { Schema } = require("mongoose");

const referralSchema = new Schema(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    referred: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    coinsAwardedToReferrer: {
      type: Number,
      default: 0,
    },

    coinsAwardedToReferred: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

referralSchema.index({ referrer: 1, referred: 1 }, { unique: true });

module.exports = Users.model("Referral", referralSchema);
