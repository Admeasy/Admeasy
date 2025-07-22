const mongoose = require('mongoose');


const Colleges = mongoose.createConnection(process.env.MONGODB_COLLEGES_URI);
const Users = mongoose.createConnection(process.env.MONGODB_USERS_URI);

Colleges && Users ? console.log('Connected to MongoDB Atlas') : console.log('An error occurred...');

module.exports = { Colleges, Users };