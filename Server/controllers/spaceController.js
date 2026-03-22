const Space = require('../models/spaceSchema');
const SpaceRequest = require('../models/spaceRequestSchema');
const UserProfile = require('../models/userProfileSchema');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { detectUrl, generateLinkPreview } = require('../utils/linkPreview');
const { verifyAdminToken } = require('../middleware/adminAuth');
const NotificationManager = require('../services/notificationManager');
const { extractPublicId } = require('../utils/cloudinary');
const { trackStudentEvent } = require('../services/interactionTrackingService');

// Helper: get current actor (user, mentor, or teacher) as a snapshot
function getActorFromReq(req) {
  const actor = req.user || req.mentor || req.teacherActor;
  if (!actor) return null;

  if (req.teacherActor) {
    return {
      id: req.teacherActor._id,
      role: 'teacher',
      name: req.teacherActor.name || 'Teacher',
      username: null,
      image: null,
    };
  }
  return {
    id: actor._id,
    role: req.mentor ? 'mentor' : 'user',
    name: actor.name,
    username: actor.username || null,
    image: actor.image || actor.imageUrl || null,
  };
}

// Check if actor can moderate (creator or in moderators list)
function canModerate(space, actorId) {
  if (!actorId) return false;
  const sid = actorId.toString();
  if (space.creator?.id?.toString() === sid) return true;
  return space.moderators?.some((m) => m.toString() === sid) || false;
}

// Check if user (student) is in the same school as the space
async function isSchoolMember(userId, schoolId) {
  if (!userId || !schoolId) return false;
  const profile = await UserProfile.findOne({ userId });
  return profile?.schoolId?.toString() === schoolId.toString();
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
  const messagesCount = (space.messages || []).length;
  const sortedMessages = [...(space.messages || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const lastMessage = sortedMessages[0] || null;

  const isMember =
    !!currentActorId &&
    space.members.some((m) => m.id && m.id.toString() === currentActorId.toString());

  const result = {
    _id: space._id,
    name: space.name,
    description: space.description,
    logo: space.logo || null,
    type: space.type || 'public',
    schoolId: space.schoolId || null,
    isJoinApprovalRequired: space.isJoinApprovalRequired || false,
    isPostingRestricted: space.isPostingRestricted || false,
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
  return result;
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

    const { name, description = '', type = 'public', isJoinApprovalRequired = false, isPostingRestricted = false } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Space name is required',
      });
    }

    if (!['public', 'private'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Only public and private spaces can be created by users. School spaces are created by the system.',
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
      description: (description || '').trim(),
      logo: logoUrl,
      type,
      isJoinApprovalRequired: !!isJoinApprovalRequired,
      isPostingRestricted: !!isPostingRestricted,
      creator: creatorSnapshot,
      members: [creatorSnapshot],
      moderators: [actor.id], // Creator is moderator
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

    const query = { type: 'public' };
    if (actor) {
      query['members.id'] = { $ne: actor.id };
    }
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

// GET /api/spaces/explore - all public spaces (only type=public)
exports.getAllPublicSpaces = async (req, res) => {
  try {
    const actor = getActorFromReq(req);

    const spaces = await Space.find({ type: 'public' })
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
        (m) => m.id && m.id.toString() === actor.id.toString()
      );

    // For private/school spaces, non-members get limited view (no messages)
    const canViewMessages = isMember || space.type === 'public';
    if (!canViewMessages && (space.type === 'private' || space.type === 'school')) {
      return res.json({
        success: true,
        space: {
          _id: space._id,
          name: space.name,
          description: space.description,
          logo: space.logo,
          type: space.type || 'public',
          schoolId: space.schoolId,
          isJoinApprovalRequired: space.isJoinApprovalRequired,
          isPostingRestricted: space.isPostingRestricted,
          membersCount: space.members?.length || 0,
          isMember: false,
          createdAt: space.createdAt,
          updatedAt: space.updatedAt,
        },
        messages: [],
        pagination: { page: 1, limit: 20, totalMessages: 0, totalPages: 0, hasMore: false },
      });
    }

    // Pagination support for messages
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const allMessages = space.messages || [];
    const totalMessages = allMessages.length;
    const totalPages = Math.ceil(totalMessages / limit);

    const sortedMessages = [...allMessages].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    const paginatedMessages = sortedMessages.slice(skip, skip + limit);
    const reversedMessages = paginatedMessages.reverse();

    return res.json({
      success: true,
      space: {
        _id: space._id,
        name: space.name,
        description: space.description,
        logo: space.logo,
        type: space.type || 'public',
        schoolId: space.schoolId,
        isJoinApprovalRequired: space.isJoinApprovalRequired,
        isPostingRestricted: space.isPostingRestricted,
        creator: space.creator,
        members: space.members,
        membersCount: space.members?.length || 0,
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

    // Only users (students) can join via this endpoint - teachers join through school flow
    if (actor.role === 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Teachers join spaces through school assignment',
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
      (m) => m.id && m.id.toString() === actor.id.toString()
    );

    if (alreadyMember) {
      return res.json({
        success: true,
        message: 'Already a member',
        space: formatSpaceSummary(space, actor.id),
      });
    }

    // School space: only school members can join
    if (space.type === 'school') {
      const inSchool = await isSchoolMember(actor.id, space.schoolId);
      if (!inSchool) {
        return res.status(403).json({
          success: false,
          message: 'Only members of this school can join this space',
        });
      }
    }

    // Private/School with join approval: create request instead of direct join
    if (space.isJoinApprovalRequired) {
      const existing = await SpaceRequest.findOne({
        userId: actor.id,
        spaceId: space._id,
      });
      if (existing) {
        if (existing.status === 'approved') {
          return res.json({
            success: true,
            message: 'Already a member',
            space: formatSpaceSummary(space, actor.id),
          });
        }
        if (existing.status === 'pending') {
          return res.status(400).json({
            success: false,
            message: 'Join request already pending',
          });
        }
        if (existing.status === 'rejected') {
          return res.status(400).json({
            success: false,
            message: 'Your previous request was rejected',
          });
        }
      }
      const request = new SpaceRequest({
        userId: actor.id,
        spaceId: space._id,
        status: 'pending',
      });
      await request.save();
      return res.status(202).json({
        success: true,
        message: 'Join request submitted',
        requestId: request._id,
        space: formatSpaceSummary(space, actor.id),
      });
    }

    // Direct join (public, or private/school without approval)
    space.members.push({
      ...actor,
      joinedAt: new Date(),
    });
    await space.save();

    if (req.user?._id) {
      trackStudentEvent({
        userId: req.user._id,
        eventType: 'space_join',
        entityId: space._id,
        space,
        dedupeWindowSeconds: 60,
      }).catch((err) => console.error('space_join tracking failed:', err));
    }

    if (global.io) {
      global.io.to(`space:${space._id}`).emit('space_member_joined', {
        spaceId: space._id.toString(),
        member: { ...actor, joinedAt: new Date() },
        membersCount: space.members.length,
      });
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
      (m) => m.id && m.id.toString() === actor.id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must join the space to post',
      });
    }

    if (space.isPostingRestricted && !canModerate(space, actor.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only moderators can post in this space',
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
    if (req.user?._id) {
      trackStudentEvent({
        userId: req.user._id,
        eventType: 'comment_posted',
        entityId: createdMessage?._id || null,
        space,
        metadata: { spaceId: space._id },
        dedupeWindowSeconds: 5,
      }).catch((err) => console.error('comment_posted tracking failed:', err));
    }

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
    const spaces = await Space.find().sort({ createdAt: -1 }).lean();

    const formatted = spaces.map((space) => ({
      ...formatSpaceAdmin(space),
      type: space.type || 'public',
      schoolId: space.schoolId,
    }));

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

// ================= SPACE REQUESTS =================

// GET /api/spaces/:spaceId/requests - list pending join requests (moderator/teacher only)
exports.getSpaceRequests = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const space = await Space.findById(req.params.spaceId).lean();
    if (!space) {
      return res.status(404).json({ success: false, message: 'Space not found' });
    }

    const canReview = canModerate(space, actor.id) ||
      (space.type === 'school' && req.schoolAuth?.teacherId && actor.role === 'teacher');
    if (!canReview) {
      return res.status(403).json({ success: false, message: 'Not authorized to view requests' });
    }

    const requests = await SpaceRequest.find({
      spaceId: space._id,
      status: 'pending',
    })
      .populate('userId', 'name email username')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      requests: requests.map((r) => ({
        _id: r._id,
        userId: r.userId,
        spaceId: r.spaceId,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching space requests:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// POST /api/spaces/approve - approve or reject a join request
exports.approveRequest = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    if (!actor) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { requestId, approved } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required' });
    }

    const request = await SpaceRequest.findById(requestId).populate('userId');
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Request not found or already processed' });
    }

    const space = await Space.findById(request.spaceId);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Space not found' });
    }

    const canReview = canModerate(space, actor.id) ||
      (space.type === 'school' && req.schoolAuth?.teacherId && actor.role === 'teacher');
    if (!canReview) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve requests' });
    }

    request.status = approved ? 'approved' : 'rejected';
    request.reviewedBy = actor.id;
    request.reviewedAt = new Date();
    await request.save();

    if (approved) {
      const user = request.userId && request.userId._id ? request.userId : await require('../models/userSchema').findById(request.userId).select('name username image').lean();
      const userId = user?._id || request.userId;
      const memberSnapshot = {
        id: userId,
        role: 'user',
        username: user?.username || null,
        name: user?.name || 'User',
        image: user?.image || null,
        joinedAt: new Date(),
      };
      space.members.push(memberSnapshot);
      await space.save();

      if (global.io) {
        global.io.to(`space:${space._id}`).emit('space_member_joined', {
          spaceId: space._id.toString(),
          member: memberSnapshot,
          membersCount: space.members.length,
        });
      }
    }

    return res.json({
      success: true,
      message: approved ? 'Request approved' : 'Request rejected',
      request: { _id: request._id, status: request.status },
      space: formatSpaceSummary(space, actor.id),
    });
  } catch (error) {
    console.error('Error approving request:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
