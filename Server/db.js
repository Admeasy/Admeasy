require("dotenv").config();
const mongoose = require('mongoose');

const Admeasy = mongoose.createConnection(process.env.MONGODB_ADMEASY_URI);

const Users = mongoose.createConnection(process.env.MONGODB_USERS_URI);

const Applications = mongoose.createConnection(process.env.MONGODB_APPLICATIONS_URI);

const Chats = mongoose.createConnection(process.env.MONGODB_CHATS_URI);

// Proper connection status logs
Admeasy.on("connected", () => console.log("Admeasy DB Connected"));
Users.on("connected", () => console.log("Users DB Connected"));
Applications.on("connected", () => console.log("Applications DB Connected"));
Chats.on("connected", () => console.log("Chats DB Connected"));

module.exports = { Admeasy, Users, Applications, Chats };