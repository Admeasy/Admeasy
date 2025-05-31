const mongoose = require('mongoose');

const CoursesCollectionsSchema = new mongoose.Schema({
    courses : [{
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
}]
})

module.exports = mongoose.model('Courses', CoursesCollectionsSchema);