const mongoose = require('mongoose');

const Admeasy = mongoose.createConnection(process.env.MONGODB_ADMEASY_URI);

const Users = mongoose.createConnection(process.env.MONGODB_USERS_URI);

const Applications = mongoose.createConnection(process.env.MONGODB_APPLICATIONS_URI);

// Proper connection status logs
Admeasy.on("connected", () => console.log("Admeasy DB Connected"));
Users.on("connected", () => console.log("Users DB Connected"));
Applications.on("connected", () => console.log("Applications DB Connected"));

module.exports = { Admeasy, Users, Applications };