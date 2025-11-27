const mongoose = require('mongoose');

const Admeasy = mongoose.createConnection(process.env.MONGODB_ADMEASY_URI);
const Users = mongoose.createConnection(process.env.MONGODB_USERS_URI);
const Applications = mongoose.createConnection(process.env.MONGODB_APPLICATIONS_URI);

Admeasy && Users && Applications ? console.log('Connected to MongoDB Atlas') : console.log('An error occurred...');

module.exports = { Admeasy, Users, Applications };