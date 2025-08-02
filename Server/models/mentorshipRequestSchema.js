const mongoose = require('mongoose');
const { Applications } = require('../db');

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
    image: {
        type: String,
        required: true
    }
});

module.exports = Applications.model('Mentorship', Schema);