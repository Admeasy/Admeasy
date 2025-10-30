const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const Schema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: Number,
        required: true,
        trim: true
    },
    college: {
        type: String,
        required: true,
        trim: true
    },
    course: {
        type: String,
        required: true,
        trim: true
    },
    tagline: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    competitiveExamsAttempted: [{
        name: {
            type: String,
            trim: true,
            required: true
        },
        rank: {
            type: String,
            trim: true,
            required: true
        }
    }]
});

module.exports = Admeasy.model('Mentors', Schema);