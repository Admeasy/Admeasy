const mongoose = require("mongoose");
const { Users } = require("../db.js");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
  },
  gender: {
    type: String,
    trim: true,
  },
  course: {
    type: String,
    trim: true,
  },
  institute: {
    type: String,
    trim: true,
  },
  phone: {
    type: Number,
  },
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false, // Optional for Google OAuth users
    select: false, // do not return by default
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  refreshToken: {
    type: String,
    default: null,
  },
  // Onboarding fields
  languages: {
    type: [String],
    default: [],
  },
  city: {
    type: String,
    trim: true,
  },
  educationType: {
    type: String,
    enum: ["school", "college"],
    trim: true,
  },
  board: {
    type: String,
    trim: true,
  },
  universityName: {
    type: String,
    trim: true,
    required: function () {
      return this.educationType === "college";
    },
  },
  class: {
    type: String,
    trim: true,
  },
  stream: {
    type: String,
    trim: true,
  },
  schoolName: {
    type: String,
    trim: true,
  },
  courseLevel: {
    type: String,
    trim: true,
  },
  courseDetails: {
    type: String,
    trim: true,
  },
  collegeName: {
    type: String,
    trim: true,
  },
  examsPreparingFor: {
    type: [String],
    default: [],
  },
  reasonForAdmeasy: {
    type: String,
    trim: true,
  },
  reasonForAdmeasyInput: {
    type: String,
    trim: true,
  },
  hasCompletedOnboarding: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
    trim: true,
  },
  resetPasswordExpire: {
    type: Date,
  },
  // Array of reposted mentor post IDs
  reposts: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "MentorPosts",
    default: [],
  },
  // Array of followed user/mentor IDs (can be Users or Mentors)
  following: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
  // Array of follower IDs (can be Users or Mentors)
  followers: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
  //  Verify email
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerifyToken: String,
  emailVerifyExpiry: Date,
  dateOfBirth: {
    type: Date,
  },

  // Referral fields
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values, safe for existing users who dont have it yet
    trim: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },
  coinBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  coinsEarnedThisMonth: {
    type: Number,
    default: 0,
  },
  //Tracks which month the counter belongs to eg "2024-03"
  //Auto-resers when the month changes via cron job
  coinMonthKey: {
    type: String,
    default: "",
  },

  //True after user maes their first successful purchase
  hasCompletedFirstPurchase: {
    type: Boolean,
    default: false,
  },

  //Tracks the date of the first coin earned
  showFirstCoinPopup: {
    type: Boolean,
    default: false,
  },

  // Inactivity notification fields
  lastActive: {
    type: Date,
    default: Date.now,
  },
  lastNotifiedMilestone: {
    type: Number,
    default: 0, // 0, 7, 15, 30
  },
});

// Replace the pre-save hook with this:
userSchema.pre("save", async function (next) {
  if (!this.referralCode) {
    let code;
    let exists = true;
    while (exists) {
      code = crypto.randomBytes(4).toString("hex").toUpperCase();
      // Use `this.constructor` instead of mongoose.model("Users")
      // This always refers to the correct model on the correct connection
      exists = await this.constructor.exists({ referralCode: code });
    }
    this.referralCode = code;
  }
  next();
});

module.exports = Users.model("Users", userSchema);
