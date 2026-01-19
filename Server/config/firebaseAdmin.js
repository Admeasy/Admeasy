const admin = require("firebase-admin");
const serviceAccount = require("./admeasy-6f0ab-firebase-adminsdk-fbsvc-55e35935a4.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;