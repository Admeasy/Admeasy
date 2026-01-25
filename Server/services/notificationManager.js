const Notification = require("../models/notificationSchema");
const NotificationToken = require("../models/NotificationToken");
const sendNotification = require("../utils/sendNotification");
const User = require("../models/userSchema");
const Mentor = require("../models/mentorSchema");

/**
 * Check if a user/mentor is currently viewing a specific space
 * @param {string} recipientId - User/mentor ID
 * @param {string} recipientRole - "user" or "mentor"
 * @param {string} spaceId - Space ID to check
 * @returns {boolean} - True if user is viewing the space
 */
function isUserViewingSpace(recipientId, recipientRole, spaceId) {
  if (!global.io) return false;
  
  const normalizedSpaceId = String(spaceId);
  const normalizedRecipientId = String(recipientId);
  
  // Check all connected sockets
  const sockets = global.io.sockets.sockets;
  for (const [socketId, socket] of sockets) {
    const socketUserId = socket.userId || socket.mentorId;
    const socketRole = socket.userRole;
    
    // Check if this socket belongs to the recipient
    if (socketUserId && 
        String(socketUserId) === normalizedRecipientId && 
        socketRole === recipientRole &&
        socket.currentSpaceId === normalizedSpaceId) {
      return true;
    }
  }
  
  return false;
}

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
    skipIfViewingSpace = false, // New parameter to skip push notifications if user is viewing the space
  }) {
    try {
      // Prevent self-notification
      if (actorId.toString() === recipientId.toString()) {
        return;
      }
      
      // Check if this is a space-related notification and user is viewing the space
      if (skipIfViewingSpace && originPath && originPath.startsWith('/spaces/')) {
        const spaceIdMatch = originPath.match(/\/spaces\/([^/]+)/);
        if (spaceIdMatch) {
          const spaceId = spaceIdMatch[1];
          if (isUserViewingSpace(recipientId, recipientRole, spaceId)) {
            // User is viewing the space, skip push notification but still save to DB
            // This allows the badge count to update but prevents toast/push
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
            await notification.save();
            return notification; // Return without sending push notification
          }
        }
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
