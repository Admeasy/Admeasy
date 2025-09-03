const { Applications } = require('../db');
const mongoose = require('mongoose')

const EnrollmentsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  number: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = Applications.model('Enrollments',EnrollmentsSchema)