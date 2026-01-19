const mongoose = require("mongoose");
const { Users } = require("../db");

const schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    userRole: {
        type: String,
        enum: ["user", "mentor"],
        default: "user",
    },
    token: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        default: "web",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastUsedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = Users.model("NotificationToken", schema);
