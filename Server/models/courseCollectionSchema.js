const mongoose = require('mongoose');
const courseSchema = require('./courseSchema');

const CoursesCollectionsSchema = new mongoose.Schema({
    courses : [courseSchema]
})

module.exports = mongoose.model('Courses', CoursesCollectionsSchema);