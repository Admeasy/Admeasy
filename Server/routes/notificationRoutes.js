const express = require("express");
const router = express.Router();
const NotificationToken = require("../models/NotificationToken");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// Subscribe to push notifications
router.post("/subscribe", async (req, res) => {
  const { userId, token, userRole } = req.body;

  await NotificationToken.findOneAndUpdate(
    { userId, userRole: userRole || "user" },
    { token, isActive: true, lastUsedAt: new Date() },
    { upsert: true }
  );

  res.json({ success: true });
});

// Get all notifications
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.post("/mark-all-read", markAllAsRead);

module.exports = router;