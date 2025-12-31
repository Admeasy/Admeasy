const mongoose = require('mongoose');
const { Admeasy } = require('../db');

const Schema = new mongoose.Schema({
    image: {
        type: String,
    },
    name: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        trim: true,
        unique: true,
        sparse: true // Allows multiple null values
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: Number,
        trim: true
    },
    college: {
        name: {
            type: String,
            trim: true,
        },
        id: {
            type: String,
            trim: true,
        }
    },
    course: {
        name: {
            type: String,
            trim: true
        },
        id: {
            type: String,
            trim: true
        }
    },
    tagline: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    competitiveExamsCleared: [{
        name: {
            type: String,
            trim: true,
            required: true
        }
    }],
    followers: [{
        type: String,
        trim: true
    }],
    notesUploaded: {
        type: String,
        trim: true,
    },
    refreshToken: {
        type: String,
        default: null
    }
});

module.exports = Admeasy.model('Mentor', Schema);