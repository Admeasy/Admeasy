const mongoose = require('mongoose');

const Colleges = mongoose.createConnection(process.env.MONGODB_COLLEGES_URI);
const Users = mongoose.createConnection(process.env.MONGODB_USERS_URI);
const Applications = mongoose.createConnection(process.env.MONGODB_APPLICATIONS_URI);

Colleges && Users && Applications ? console.log('Connected to MongoDB Atlas') : console.log('An error occurred...');

module.exports = { Colleges, Users, Applications };