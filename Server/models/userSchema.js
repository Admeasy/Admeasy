const mongoose = require('mongoose');
const { Users } = require('../db');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    image: {
        type: String,
    },
    gender: {
        type: String,
        trim: true
    },
    course: {
        type: String,
        trim: true
    },
    institute: {
        type: String,
        trim: true
    },
    phone: {
        type: Number,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false // do not return by default
    },
    refreshToken: {
        type: String,
        default: null
    },
    // Onboarding fields
    languages: {
        type: [String],
        default: []
    },
    city: {
        type: String,
        trim: true
    },
    educationType: {
        type: String,
        enum: ['school', 'college'],
        trim: true
    },
    board: {
        type: String,
        trim: true
    },
    universityName: {
        type: String,
        trim: true
    },
    class: {
        type: String,
        trim: true
    },
    stream: {
        type: String,
        trim: true
    },
    schoolName: {
        type: String,
        trim: true
    },
    courseLevel: {
        type: String,
        trim: true
    },
    courseDetails: {
        type: String,
        trim: true
    },
    collegeName: {
        type: String,
        trim: true
    },
    examsPreparingFor: {
        type: [String],
        default: []
    },
    reasonForAdmeasy: {
        type: String,
        trim: true
    },
    reasonForAdmeasyInput: {
        type: String,
        trim: true
    },
    hasCompletedOnboarding: {
        type: Boolean,
        default: false
    }
})

module.exports = Users.model('Users', userSchema);