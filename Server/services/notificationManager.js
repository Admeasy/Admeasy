const Notification = require("../models/notificationSchema");
const NotificationToken = require("../models/NotificationToken");
const sendNotification = require("../utils/sendNotification");
const User = require("../models/userSchema");
const Mentor = require("../models/mentorSchema");

/**
 * Comprehensive Notification Manager
 * Handles both storing notifications in DB and sending FCM push notifications
 */
class NotificationManager {
  /**
   * Create and send a notification
   * @param {Object} params
   * @param {string} params.recipientId - User/mentor receiving notification
   * @param {string} params.recipientRole - "user" or "mentor"
   * @param {string} params.actorId - User/mentor who triggered the event
   * @param {string} params.type - Notification type (FOLLOW, POST_LIKE, etc.)
   * @param {string} params.entityType - "USER", "POST", "COMMENT", "MESSAGE"
   * @param {string} params.entityId - ID of the entity (postId, commentId, etc.)
   * @param {string} params.originPath - Frontend route for navigation
   * @param {string} params.message - Display message
   * @param {Object} params.actorInfo - Optional actor name/image for display
   */
  static async createAndSend({
    recipientId,
    recipientRole,
    actorId,
    type,
    entityType,
    entityId,
    originPath,
    message,
    actorInfo = null,
  }) {
    try {
      // Prevent self-notification
      if (actorId.toString() === recipientId.toString()) {
        return;
      }

      // Check for duplicate notification (same actor, type, entity within last minute)
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const existing = await Notification.findOne({
        recipientId,
        recipientRole,
        actorId,
        type,
        entityType,
        entityId,
        createdAt: { $gte: oneMinuteAgo },
      });

      if (existing) {
        return; // Avoid duplicates
      }

      // Create notification document
      const notification = new Notification({
        recipientId,
        recipientRole,
        actorId,
        type,
        entityType,
        entityId,
        originPath,
        message,
        isRead: false,
      });

      // Save to database first
      await notification.save();

      // Get actor info if not provided
      let actorName = "Someone";
      if (actorInfo) {
        actorName = actorInfo.name || actorInfo.username || actorName;
      } else {
        try {
          const actor =
            (await User.findById(actorId)) ||
            (await Mentor.findById(actorId));
          if (actor) {
            actorName = actor.name || actor.username || actorName;
          }
        } catch (err) {
          console.error("Error fetching actor info:", err);
        }
      }

      // Fetch FCM tokens for recipient
      const tokens = await NotificationToken.find({
        userId: recipientId,
        userRole: recipientRole,
        isActive: true,
      }).select("token");

      if (tokens && tokens.length > 0) {
        const tokenStrings = tokens.map((t) => t.token).filter(Boolean);

        // Customize notification title based on type
        let notificationTitle = "New notification";
        if (type === 'MESSAGE') {
          notificationTitle = "New message";
        } else if (type === 'FOLLOW' || type === 'FOLLOW_BACK') {
          notificationTitle = "New follower";
        } else if (type === 'POST_LIKE' || type === 'COMMENT_LIKE') {
          notificationTitle = "New like";
        } else if (type === 'COMMENT') {
          notificationTitle = "New comment";
        } else if (type === 'REPOST') {
          notificationTitle = "New repost";
        } else if (type === 'FOLLOWING_POST') {
          notificationTitle = "New post";
        } else if (type === 'REPLY') {
          notificationTitle = "New reply";
        }

        // Send FCM push notification
        await sendNotification(
          tokenStrings,
          notificationTitle,
          message,
          {
            originPath,
            notificationId: notification._id.toString(),
            type,
            entityType,
            entityId: entityId ? entityId.toString() : '',
          }
        );
      }

      return notification;
    } catch (error) {
      console.error("Error in NotificationManager.createAndSend:", error);
      // Don't throw - notification creation failure shouldn't break main flow
      return null;
    }
  }

  /**
   * Notify multiple recipients (e.g., followers)
   */
  static async createAndSendMultiple({
    recipientIds,
    recipientRole = "user",
    actorId,
    type,
    entityType,
    entityId,
    originPath,
    message,
    actorInfo = null,
  }) {
    if (!recipientIds || recipientIds.length === 0) return;

    // Filter out actor from recipients
    const validRecipientIds = recipientIds.filter(
      (id) => id.toString() !== actorId.toString()
    );

    if (validRecipientIds.length === 0) return;

    // Create notifications for all recipients in parallel
    const promises = validRecipientIds.map((recipientId) =>
      this.createAndSend({
        recipientId,
        recipientRole,
        actorId,
        type,
        entityType,
        entityId,
        originPath,
        message,
        actorInfo,
      })
    );

    await Promise.allSettled(promises);
  }
}

module.exports = NotificationManager;
