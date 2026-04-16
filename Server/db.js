const dns = require('dns');
// Set external DNS servers to bypass local SRV lookup issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

require("dotenv").config();
const mongoose = require('mongoose');

const connectionOptions = {
  family: 4, // Force IPv4
};

const Admeasy = mongoose.createConnection(process.env.MONGODB_ADMEASY_URI, connectionOptions);
const Users = mongoose.createConnection(process.env.MONGODB_USERS_URI, connectionOptions);
const Applications = mongoose.createConnection(process.env.MONGODB_APPLICATIONS_URI, connectionOptions);
const Chats = mongoose.createConnection(process.env.MONGODB_CHATS_URI, connectionOptions);

// Proper connection status logs
Admeasy.on("connected", () => console.log("Admeasy DB Connected"));
Users.on("connected", () => console.log("Users DB Connected"));
Applications.on("connected", () => console.log("Applications DB Connected"));
Chats.on("connected", () => console.log("Chats DB Connected"));

module.exports = { Admeasy, Users, Applications, Chats };