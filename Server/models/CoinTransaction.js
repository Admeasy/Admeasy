const mongoose = require("mongoose");
const { Users } = require("../db.js");

const coinTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "earned_referral", // referrer gets coins when referred buys
        "earned_referred", // referred user gets coins on first buy
        "spent_mentorship", // coins used to buy mentorship
        "spent_notes", // coins used to buy paid notes
      ],
      required: true,
    },

    coins: {
      type: Number,
      required: true,
      // positive = earned, negative = spent
    },

    balanceAfter: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      default: "",
      // e.g. "Referral bonus - Rahul made first purchase"
    },

    // Links to the referral or order that triggered this
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      // can point to Referral._id or Order._id
    },

    referenceModel: {
      type: String,
      enum: ["Referral", "Order", null],
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = Users.model("CoinTransaction", coinTransactionSchema);
