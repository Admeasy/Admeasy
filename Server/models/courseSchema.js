const mongoose = require('mongoose');

const courseObjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    semesters: {
        type: Number,
        required: true
    },
    feeStructure: {
        feePerSemester: {
            type: Number,
            required: true
        },
        additionals: {
            type: Map,
            of: Number,
            default: {}
        }
    }
}, { _id: false });

module.exports = mongoose.model('Courses', courseObjectSchema);