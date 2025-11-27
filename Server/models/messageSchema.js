const mongoose = require('mongoose');
const { Applications } = require('../db');


const Schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = Applications.model('Messages', Schema);