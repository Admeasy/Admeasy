const Space = require('../models/spaceSchema');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { detectUrl, generateLinkPreview } = require('../utils/linkPreview');
const { verifyAdminToken } = require('../middleware/adminAuth');
const NotificationManager = require('../services/notificationManager');
const { extractPublicId } = require('../utils/cloudinary');

// Helper: get current actor (user or mentor) as a snapshot
function getActorFromReq(req) {
  const actor = req.user || req.mentor;
  if (!actor) return null;

  return {
    id: actor._id,
    role: req.mentor ? 'mentor' : 'user',
    name: actor.name,
    username: actor.username || null,
    image: actor.image || actor.imageUrl || null,
  };
}

// Admin: format space for admin listing (more details)
function formatSpaceAdmin(space) {
  const membersCount = space.members.length;
  const messagesCount = space.messages.length;

  return {
    _id: space._id,
    name: space.name,
    description: space.description,
    logo: space.logo || null,
    membersCount,
    messagesCount,
    creator: space.creator || null,
    createdAt: space.createdAt,
    updatedAt: space.updatedAt,
  };
}

// Helper: format space for list views
function formatSpaceSummary(space, currentActorId) {
  const membersCount = space.members.length;
  const messagesCount = space.messages.length;
  const lastMessage = space.messages[messagesCount - 1] || null;

  const isMember =
    !!currentActorId &&
    space.members.some((m) => m.id.toString() === currentActorId.toString());

  return {
    _id: space._id,
    name: space.name,
    description: space.description,
    logo: space.logo || null,
    membersCount,
    messagesCount,
    lastMessage: lastMessage
      ? {
          _id: lastMessage._id,
          authorName: lastMessage.author?.name || 'Someone',
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
        }
      : null,
    isMember,
    createdAt: space.createdAt,
    updatedAt: space.updatedAt,
  };
}

exports.createSpace = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { name, description = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Space name is required',
      });
    }

    const creatorSnapshot = {
      ...actor,
      joinedAt: new Date(),
    };

    // Optional logo upload (handled via multer in route)
    let logoUrl = null;
    if (req.file) {
      try {
        logoUrl = await uploadToCloudinary(req.file.path, 'spaces/logos');
      } catch (uploadError) {
        console.error('Error uploading space logo:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading logo image',
        });
      }
    }

    const space = new Space({
      name: name.trim(),
      description: description.trim(),
      logo: logoUrl,
      creator: creatorSnapshot,
      members: [creatorSnapshot],
    });

    await space.save();

    return res.status(201).json({
      success: true,
      message: 'Space created successfully',
      space: formatSpaceSummary(space, actor.id),
    });
  } catch (error) {
    console.error('Error creating space:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// GET /api/spaces - spaces current user/mentor is a member of
exports.getMySpaces = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const spaces = await Space.find({
      'members.id': actor.id,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const summaries = spaces.map((s) =>
      formatSpaceSummary(s, actor.id)
    );

    return res.json({
      success: true,
      spaces: summaries,
    });
  } catch (error) {
    console.error('Error fetching user spaces:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// GET /api/spaces/discover - suggested public spaces
exports.getSuggestedSpaces = async (req, res) => {
  try {
    const actor = getActorFromReq(req);

    const query = actor
      ? { 'members.id': { $ne: actor.id } }
      : {};

    const spaces = await Space.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const summaries = spaces.map((s) =>
      formatSpaceSummary(s, actor?.id)
    );

    return res.json({
      success: true,
      spaces: summaries,
    });
  } catch (error) {
    console.error('Error fetching suggested spaces:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// GET /api/spaces/explore - all public spaces (includes spaces user is already a member of)
exports.getAllPublicSpaces = async (req, res) => {
  try {
    const actor = getActorFromReq(req);

    // Get all spaces without filtering by membership
    const spaces = await Space.find({})
      .sort({ createdAt: -1 })
      .lean();

    const summaries = spaces.map((s) =>
      formatSpaceSummary(s, actor?.id)
    );

    return res.json({
      success: true,
      spaces: summaries,
    });
  } catch (error) {
    console.error('Error fetching all public spaces:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// GET /api/spaces/:id - full space with messages (supports pagination)
exports.getSpaceById = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    const space = await Space.findById(req.params.id).lean();

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found',
      });
    }

    const isMember =
      actor &&
      space.members.some(
        (m) => m.id.toString() === actor.id.toString()
      );

    // Pagination support for messages
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get total message count
    const totalMessages = space.messages.length;
    const totalPages = Math.ceil(totalMessages / limit);

    // Get paginated messages (newest first, then reverse for display)
    const allMessages = space.messages || [];
    const sortedMessages = [...allMessages].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    const paginatedMessages = sortedMessages.slice(skip, skip + limit);
    // Reverse to show oldest first in the paginated set
    const reversedMessages = paginatedMessages.reverse();

    return res.json({
      success: true,
      space: {
        _id: space._id,
        name: space.name,
        description: space.description,
        logo: space.logo,
        creator: space.creator,
        members: space.members,
        membersCount: space.members.length,
        isMember,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
      },
      messages: reversedMessages,
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching space:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// POST /api/spaces/:id/join
exports.joinSpace = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found',
      });
    }

    const alreadyMember = space.members.some(
      (m) => m.id.toString() === actor.id.toString()
    );

    if (!alreadyMember) {
      space.members.push({
        ...actor,
        joinedAt: new Date(),
      });
      await space.save();

      // Emit socket event for real-time updates
      if (global.io) {
        global.io.to(`space:${space._id}`).emit('space_member_joined', {
          spaceId: space._id.toString(),
          member: {
            ...actor,
            joinedAt: new Date(),
          },
          membersCount: space.members.length,
        });
      }
    }

    return res.json({
      success: true,
      message: 'Joined space',
      space: formatSpaceSummary(space, actor.id),
    });
  } catch (error) {
    console.error('Error joining space:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// POST /api/spaces/:id/leave
exports.leaveSpace = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found',
      });
    }

    space.members = space.members.filter(
      (m) => m.id.toString() !== actor.id.toString()
    );
    await space.save();

    // Emit socket event for real-time updates
    if (global.io) {
      global.io.to(`space:${space._id}`).emit('space_member_left', {
        spaceId: space._id.toString(),
        memberId: actor.id.toString(),
        membersCount: space.members.length,
      });
    }

    return res.json({
      success: true,
      message: 'Left space',
      space: formatSpaceSummary(space, actor.id),
    });
  } catch (error) {
    console.error('Error leaving space:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// POST /api/spaces/:id/messages
exports.createMessage = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { content, replyToMessageId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found',
      });
    }

    const isMember = space.members.some(
      (m) => m.id.toString() === actor.id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must join the space to post',
      });
    }

    // Detect URL in content
    const detectedUrl = detectUrl(content);
    let linkPreview = null;

    if (detectedUrl) {
      try {
        linkPreview = await generateLinkPreview(detectedUrl);
      } catch (previewError) {
        console.log('Space link preview generation failed:', previewError.message);
      }
    }

    // Handle optional image upload
    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.path, 'spaces/messages');
      } catch (uploadError) {
        console.error('Error uploading space image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
        });
      }
    }

    const message = {
      author: {
        ...actor,
        joinedAt: undefined,
      },
      content: content.trim(),
      image: imageUrl,
      replyTo: replyToMessageId || null,
    };

    if (linkPreview) {
      message.externalLink = {
        url: linkPreview.url,
        preview: {
          title: linkPreview.title,
          description: linkPreview.description,
          image: linkPreview.image,
          domain: linkPreview.domain,
          platform: linkPreview.platform,
          favicon: linkPreview.favicon,
        },
      };
    }

    space.messages.push(message);
    await space.save();

    const createdMessage = space.messages[space.messages.length - 1];

    // Emit socket event for real-time updates
    if (global.io) {
      // Convert Mongoose subdocument to plain object
      const messageObj = createdMessage.toObject ? createdMessage.toObject() : createdMessage;
      const formattedMessage = {
        _id: messageObj._id,
        author: messageObj.author,
        content: messageObj.content,
        image: messageObj.image || null,
        replyTo: messageObj.replyTo || null,
        externalLink: messageObj.externalLink || null,
        likes: messageObj.likes || [],
        likesCount: messageObj.likesCount || 0,
        createdAt: messageObj.createdAt,
      };
      // Normalize spaceId to string for consistent room naming
      const normalizedSpaceId = String(space._id);
      const roomName = `space:${normalizedSpaceId}`;
      console.log(`Emitting space_message_created to room: ${roomName}`);
      
      // Get room size for debugging
      const room = global.io.sockets.adapter.rooms.get(roomName);
      const roomSize = room ? room.size : 0;
      console.log(`Space room ${roomName} has ${roomSize} member(s) listening`);
      
      global.io.to(roomName).emit('space_message_created', {
        spaceId: normalizedSpaceId,
        message: formattedMessage,
      });
    } else {
      console.warn('global.io is not available, cannot emit space_message_created event');
    }

    // Send notifications
    (async () => {
      try {
        const actorName = actor.name || actor.username || 'Someone';
        const actorInfo = {
          name: actor.name,
          username: actor.username,
          image: actor.image,
        };

        if (replyToMessageId) {
          // This is a reply - notify the original post author
          const originalMessage = space.messages.id(replyToMessageId);
          if (originalMessage && originalMessage.author.id.toString() !== actor.id.toString()) {
            await NotificationManager.createAndSend({
              recipientId: originalMessage.author.id,
              recipientRole: originalMessage.author.role,
              actorId: actor.id,
              type: 'REPLY', // Using COMMENT type for replies
              entityType: 'POST', // Treating space messages as posts
              entityId: createdMessage._id,
              originPath: `/spaces/${space._id}`,
              message: `${actorName} replied to your post`,
              actorInfo,
              skipIfViewingSpace: true, // Skip push notification if user is viewing the space
            });
          }
        } else {
          // This is a new post - notify all space members except the poster
          const memberIds = space.members
            .filter(m => m.id.toString() !== actor.id.toString())
            .map(m => ({ id: m.id, role: m.role }));

          // Notify all members
          for (const member of memberIds) {
            await NotificationManager.createAndSend({
              recipientId: member.id,
              recipientRole: member.role,
              actorId: actor.id,
              type: 'FOLLOWING_POST', // Using FOLLOWING_POST type for space posts
              entityType: 'POST',
              entityId: createdMessage._id,
              originPath: `/spaces/${space._id}`,
              message: `${actorName} posted in ${space.name}`,
              actorInfo,
              skipIfViewingSpace: true, // Skip push notification if user is viewing the space
            });
          }
        }
      } catch (notifyError) {
        console.error('Error sending space notification:', notifyError);
      }
    })();

    // Convert Mongoose subdocument to plain object for JSON response
    const messageObj = createdMessage.toObject ? createdMessage.toObject() : createdMessage;
    const responseMessage = {
      _id: messageObj._id,
      author: messageObj.author,
      content: messageObj.content,
      image: messageObj.image || null,
      replyTo: messageObj.replyTo || null,
      externalLink: messageObj.externalLink || null,
      likes: messageObj.likes || [],
      likesCount: messageObj.likesCount || 0,
      createdAt: messageObj.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Message created successfully',
      spaceId: space._id,
      messageData: responseMessage,
    });
  } catch (error) {
    console.error('Error creating space message:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// POST /api/spaces/:spaceId/messages/:messageId/like
exports.toggleLikeMessage = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { spaceId, messageId } = req.params;
    const space = await Space.findById(spaceId);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found',
      });
    }

    const message = space.messages.id(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const existingIndex = message.likes.findIndex(
      (like) => like.id.toString() === actor.id.toString()
    );

    if (existingIndex > -1) {
      message.likes.splice(existingIndex, 1);
      message.likesCount = Math.max(0, message.likesCount - 1);
    } else {
      message.likes.push({
        id: actor.id,
        role: actor.role,
        name: actor.name,
      });
      message.likesCount = (message.likesCount || 0) + 1;
    }

    await space.save();

    // Emit socket event for real-time updates
    if (global.io) {
      // Convert likes array to plain objects
      const likesArray = (message.likes || []).map(like => ({
        id: like.id,
        role: like.role,
        name: like.name,
      }));
      const messageData = {
        _id: message._id,
        likesCount: message.likesCount,
        likes: likesArray,
      };
      global.io.to(`space:${spaceId}`).emit('space_message_liked', {
        spaceId: spaceId.toString(),
        messageId: messageId.toString(),
        message: messageData,
      });
    }

    return res.json({
      success: true,
      isLiked: existingIndex === -1,
      likesCount: message.likesCount,
    });
  } catch (error) {
    console.error('Error toggling like on space message:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// DELETE /api/spaces/:spaceId/messages/:messageId - author only
exports.deleteMessage = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { spaceId, messageId } = req.params;
    const space = await Space.findById(spaceId);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found',
      });
    }

    const message = space.messages.id(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (!message.author || message.author.id.toString() !== actor.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
      });
    }

    // Delete associated image from Cloudinary if it exists
    if (message.image) {
      try {
        const publicId = extractPublicId(message.image);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (e) {
        console.error('Error deleting message image from Cloudinary:', e);
        // Continue with message deletion even if image deletion fails
      }
    }

    message.deleteOne();
    await space.save();

    // Emit socket event for real-time updates
    if (global.io) {
      global.io.to(`space:${spaceId}`).emit('space_message_deleted', {
        spaceId: spaceId.toString(),
        messageId: messageId.toString(),
      });
    }

    return res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting space message:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// DELETE /api/spaces/:id - only creator can delete
exports.deleteSpace = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found',
      });
    }

    if (!space.creator || space.creator.id.toString() !== actor.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete this space',
      });
    }

    // Delete associated logo from Cloudinary if it exists
    if (space.logo) {
      try {
        const publicId = extractPublicId(space.logo);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (e) {
        console.error('Error deleting space logo from Cloudinary:', e);
      }
    }

    await Space.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Space deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting space:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

// ================= ADMIN CONTROLLERS =================

// GET /api/spaces/admin - list all spaces (admin only)
exports.getAllSpacesAdmin = async (req, res) => {
  try {
    // verifyAdminToken middleware should already have run if wired in routes
    const spaces = await Space.find().sort({ createdAt: -1 }).lean();

    const formatted = spaces.map((space) => formatSpaceAdmin(space));

    return res.json({
      success: true,
      spaces: formatted,
    });
  } catch (error) {
    console.error('Error fetching spaces (admin):', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
