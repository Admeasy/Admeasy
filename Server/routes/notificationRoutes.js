const express = require("express");
const router = express.Router();
const Notification = require("../models/NotificationToken");

router.post("/subscribe", async (req, res) => {
    const { userId, token, userRole } = req.body;

    await Notification.findOneAndUpdate(
        { userId, userRole: userRole || "user" },
        { token },
        { upsert: true }
    );

    res.json({ success: true });
});


module.exports = router;