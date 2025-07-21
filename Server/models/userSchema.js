const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
    },
    course: {
        type: String,
        trim: true
    },
    college: {
        type: String,
        trim: true
    },
    phone: {
        type: Number,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
        required: true,
        select: false // do not return by default
    },
    refreshToken: {
        type: String,
        default: null
    }
})

module.exports = mongoose.model('Users', userSchema);