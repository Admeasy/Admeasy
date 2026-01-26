const Notification = require("../models/notificationSchema");
const User = require("../models/userSchema");
const Mentor = require("../models/mentorSchema");
const jwt = require("jsonwebtoken");
const BackblazeB2Client = require("../b2Client");
const b2 = new BackblazeB2Client();

/**
 * Helper function to get current user/mentor from request
 */
const getCurrentUser = async (req) => {
  const token = req.cookies?.accessToken;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    if (decoded.role === "mentor") {
      const mentor = await Mentor.findById(decoded.id || decoded._id);
      if (mentor) {
        return { ...mentor.toObject(), role: "mentor" };
      }
    } else {
      const user = await User.findById(decoded.id || decoded._id);
      if (user) {
        return { ...user.toObject(), role: "user" };
      }
    }
  } catch (error) {
    return null;
  }
  
  return null;
};

/**
 * GET /api/notifications
 * Get all notifications for the current user/mentor
 */
const getNotifications = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const recipientId = currentUser._id;
    const recipientRole = currentUser.role;

    // Get all notifications first, then filter out space-related ones
    const allNotifications = await Notification.find({
      recipientId,
      recipientRole,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .select('-__v');
    
    // Filter out space-related notifications (FOLLOWING_POST and REPLY with space originPath)
    const notifications = allNotifications.filter(notification => {
      // Skip if it's a FOLLOWING_POST or REPLY with originPath starting with /spaces/
      if ((notification.type === 'FOLLOWING_POST' || notification.type === 'REPLY') &&
          notification.originPath &&
          notification.originPath.startsWith('/spaces/')) {
        return false;
      }
      return true;
    });

    // Helper function to process image URL
    const processImageUrl = async (image, isMentor = false) => {
      if (!image) return null;
      
      // If it's already a full Cloudinary URL, return as-is
      if (image.includes('cloudinary.com')) {
        // Ensure it's a full URL (starts with http/https)
        if (image.startsWith('http://') || image.startsWith('https://')) {
          return image;
        }
        // If it's a relative Cloudinary URL, make it absolute
        return `https://${image.replace(/^\/\//, '')}`;
      }
      
      // If it's a Google URL, use proxy
      if (image.includes('googleusercontent.com')) {
        return `/api/users/proxy-image?url=${encodeURIComponent(image)}`;
      }
      
      // If it's a Backblaze file, get authorized URL
      try {
        const imageName = image;
        const auth = await b2.getDownloadAuthorization(imageName);
        return auth.url;
      } catch (err) {
        console.error('Error processing image URL:', err);
        // Return original if processing fails (might be a valid URL)
        return image;
      }
    };

    // Populate actor information for each notification
    const notificationsWithActors = await Promise.all(
      notifications.map(async (notification) => {
        try {
          let actor = null;
          let isMentor = false;
          
          // Try to find actor as user first, then mentor
          actor = await User.findById(notification.actorId)
            .select('name username image')
            .lean();
          
          if (!actor) {
            actor = await Mentor.findById(notification.actorId)
              .select('name username image')
              .lean();
            isMentor = true;
          }

          let processedImage = null;
          if (actor && actor.image) {
            try {
              // Process the image URL
              processedImage = await processImageUrl(actor.image, isMentor);
              // Log for debugging
              if (!processedImage) {
                console.log(`Warning: Failed to process image for actor ${actor._id}, original image: ${actor.image}`);
              }
            } catch (imgErr) {
              console.error(`Error processing image for actor ${actor._id}:`, imgErr);
              // Try to return original image as fallback
              processedImage = actor.image;
            }
          }

          return {
            ...notification,
            actor: actor
              ? {
                  _id: actor._id,
                  name: actor.name || null,
                  username: actor.username || null,
                  image: processedImage,
                }
              : {
                  _id: notification.actorId,
                  name: null,
                  username: null,
                  image: null,
                },
          };
        } catch (err) {
          console.error('Error populating actor for notification:', err);
          return {
            ...notification,
            actor: {
              _id: notification.actorId,
              name: null,
              username: null,
              image: null,
            },
          };
        }
      })
    );

    res.json({
      success: true,
      notifications: notificationsWithActors,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
const getUnreadCount = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.json({ count: 0 });
    }

    const recipientId = currentUser._id;
    const recipientRole = currentUser.role;

    // Get all unread notifications first, then filter out space-related ones
    const allUnreadNotifications = await Notification.find({
      recipientId,
      recipientRole,
      isRead: false,
    })
      .select('type originPath')
      .lean();
    
    // Filter out space-related notifications (FOLLOWING_POST and REPLY with space originPath)
    // This matches the same filtering logic used in getNotifications
    const filteredNotifications = allUnreadNotifications.filter(notification => {
      // Skip if it's a FOLLOWING_POST or REPLY with originPath starting with /spaces/
      if ((notification.type === 'FOLLOWING_POST' || notification.type === 'REPLY') &&
          notification.originPath &&
          notification.originPath.startsWith('/spaces/')) {
        return false;
      }
      return true;
    });

    const count = filteredNotifications.length;

    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

/**
 * POST /api/notifications/:id/read
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const recipientId = currentUser._id;
    const recipientRole = currentUser.role;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientId,
        recipientRole,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const recipientId = currentUser._id;
    const recipientRole = currentUser.role;

    await Notification.updateMany(
      {
        recipientId,
        recipientRole,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const recipientId = currentUser._id;
    const recipientRole = currentUser.role;

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId,
      recipientRole,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
