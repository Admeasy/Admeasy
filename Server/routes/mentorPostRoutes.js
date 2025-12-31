const express = require("express");
const router = express.Router();
const MentorPost = require("../models/mentorPostSchema");
const Mentor = require("../models/mentorSchema");
const User = require("../models/userSchema");
const { Users } = require("../db");
const authenticateMentorJWT  = require("../middleware/mentorAuth");
const authenticateJWT = require("../middleware/userAuth");
const upload = require('../middleware/multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { detectUrl, generateLinkPreview } = require('../utils/linkPreview');
const path = require('path');
const jwt = require('jsonwebtoken');

const getPublicIdFromUrl = (imageUrl) => {
  const parts = imageUrl.split('/upload/');
  if (parts.length < 2) {
    return null;
  }
  const publicIdWithExtension = parts[1];
  const extensionName = path.extname(publicIdWithExtension);
  const publicId = publicIdWithExtension.replace(extensionName, '');
  return publicId;
};

// Helper function to populate user data from Users connection
// This is needed because Users model is on a different connection than MentorPost
async function populateUser(userId) {
  if (!userId) return null;
  try {
    const UserModel = Users.model('Users');
    const user = await UserModel.findById(userId).select('name image').lean();
    return user;
  } catch (error) {
    console.error('Error populating user:', error);
    return null;
  }
}

// Batch populate multiple users at once for better performance
async function populateUsers(userIds) {
  if (!userIds || userIds.length === 0) return {};
  try {
    const UserModel = Users.model('Users');
    const uniqueIds = [...new Set(userIds.filter(id => id != null))];
    const users = await UserModel.find({ _id: { $in: uniqueIds } })
      .select('name image')
      .lean();
    
    // Create a map for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });
    return userMap;
  } catch (error) {
    console.error('Error batch populating users:', error);
    return {};
  }
}

// Optional user resolver - FIXED: Better error handling
async function getOptionalUser(req) {
  const token = req.cookies?.accessToken;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.role && decoded.role === 'mentor') return null;
    const user = await User.findById(decoded.id || decoded._id).select('following reposts');
    return user || null;
  } catch (err) {
    // Token invalid/expired - silently return null for public access
    console.log('Token validation failed (optional user):', err.message);
    return null;
  }
}

/**
 * GET /api/posts
 * Public: list mentor posts
 */
router.get("/", async (req, res) => {
  try {
    const currentUser = await getOptionalUser(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await MentorPost.find()
      .populate('mentorId', 'name username image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Manually populate user data for likes (cross-connection population)
    // Collect all user IDs first for batch lookup
    const allUserIds = [];
    posts.forEach(post => {
      (post.likes || []).forEach(like => {
        if (like.userId) allUserIds.push(like.userId);
      });
    });
    
    // Batch fetch all users
    const userMap = await populateUsers(allUserIds);
    
    // Map users to likes
    const postsWithUsers = posts.map(post => {
      const likesWithUsers = (post.likes || []).map(like => {
        const userIdStr = like.userId ? like.userId.toString() : null;
        return {
          ...like,
          userId: userIdStr ? userMap[userIdStr] || null : null,
        };
      });
      return {
        ...post,
        likes: likesWithUsers,
      };
    });

    const formattedPosts = postsWithUsers.map(post => ({
      _id: post._id,
      mentor: {
        _id: post.mentorId._id,
        name: post.mentorId.name,
        username: post.mentorId.username,
        image: post.mentorId.image,
      },
      content: post.content,
      image: post.image,
      externalLink: post.externalLink,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isLiked: currentUser
        ? post.likes.some(
            like => like.userId && like.userId._id.toString() === currentUser._id.toString()
          )
        : false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    const total = await MentorPost.countDocuments();

    res.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching mentor posts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * GET /api/posts/:postId
 * Public: single mentor post
 */
router.get("/:postId", async (req, res) => {
  try {
    const currentUser = await getOptionalUser(req);
    
    const post = await MentorPost.findById(req.params.postId)
      .populate('mentorId', 'name username image bio tagline')
      .lean();

    // Manually populate user data for likes and comments (cross-connection population)
    // Collect all user IDs for batch lookup
    const allUserIds = [];
    (post.likes || []).forEach(like => {
      if (like.userId) allUserIds.push(like.userId);
    });
    (post.comments || []).forEach(comment => {
      if (comment.userId) allUserIds.push(comment.userId);
    });
    
    // Batch fetch all users
    const userMap = await populateUsers(allUserIds);
    
    // Map users to likes and comments
    const likesWithUsers = (post.likes || []).map(like => {
      const userIdStr = like.userId ? like.userId.toString() : null;
      return {
        ...like,
        userId: userIdStr ? userMap[userIdStr] || null : null,
      };
    });

    const commentsWithUsers = (post.comments || []).map(comment => {
      const userIdStr = comment.userId ? comment.userId.toString() : null;
      return {
        ...comment,
        userId: userIdStr ? userMap[userIdStr] || null : null,
      };
    });

    post.likes = likesWithUsers;
    post.comments = commentsWithUsers;

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Manually populate likes with user data (cross-DB population)
    const populatedLikes = await Promise.all(
      (post.likes || []).map(async (like) => {
        if (like.userId) {
          try {
            const user = await User.findById(like.userId).select('name image').lean();
            return {
              _id: like._id,
              user: user ? {
                _id: user._id,
                name: user.name,
                image: user.image,
              } : { _id: like.userId },
              createdAt: like.createdAt,
            };
          } catch (err) {
            return {
              _id: like._id,
              user: { _id: like.userId },
              createdAt: like.createdAt,
            };
          }
        }
        return like;
      })
    );

    // Manually populate comments with user data (cross-DB population)
    const populatedComments = await Promise.all(
      (post.comments || []).map(async (comment) => {
        if (comment.userId) {
          try {
            const user = await User.findById(comment.userId).select('name image').lean();
            return {
              _id: comment._id,
              user: user ? {
                _id: user._id,
                name: user.name,
                image: user.image,
              } : { _id: comment.userId },
              content: comment.content,
              createdAt: comment.createdAt,
            };
          } catch (err) {
            return {
              _id: comment._id,
              user: { _id: comment.userId },
              content: comment.content,
              createdAt: comment.createdAt,
            };
          }
        }
        return comment;
      })
    );

    const formattedPost = {
      _id: post._id,
      mentor: {
        _id: post.mentorId._id,
        name: post.mentorId.name,
        username: post.mentorId.username,
        image: post.mentorId.image,
        bio: post.mentorId.bio,
        tagline: post.mentorId.tagline,
      },
      content: post.content,
      image: post.image,
      externalLink: post.externalLink,
      likes: populatedLikes,
      likesCount: post.likesCount,
      comments: populatedComments,
      commentsCount: post.commentsCount,
      isLiked: currentUser
        ? populatedLikes.some(
            like => like.user && like.user._id && like.user._id.toString() === currentUser._id.toString()
          )
        : false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };

    res.json({ success: true, post: formattedPost });
  } catch (error) {
    console.error("Error fetching mentor post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/posts
 * Create a new mentor post (mentors only)
 */
router.post("/", authenticateMentorJWT, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Content is required" 
      });
    }

    // Detect URL in content
    const detectedUrl = detectUrl(content);
    let linkPreview = null;
    
    if (detectedUrl) {
      try {
        linkPreview = await generateLinkPreview(detectedUrl);
      } catch (previewError) {
        console.log('Link preview generation failed:', previewError.message);
        // Continue without preview
      }
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.path, 'mentor_posts');
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error uploading image' 
        });
      }
    }

    // Create post
    const postData = {
      mentorId: req.mentor._id,
      content: content.trim(),
      image: imageUrl,
    };

    if (linkPreview) {
      postData.externalLink = {
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

    const post = new MentorPost(postData);
    await post.save();

    await post.populate('mentorId', 'name username image');

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: {
        _id: post._id,
        mentor: {
          _id: post.mentorId._id,
          name: post.mentorId.name,
          username: post.mentorId.username,
          image: post.mentorId.image,
        },
        content: post.content,
        image: post.image,
        externalLink: post.externalLink,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating mentor post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * PUT /api/posts/:postId
 * Update a mentor post (only the creator mentor)
 */
router.put("/:postId", authenticateMentorJWT, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    const post = await MentorPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.mentorId.toString() !== req.mentor._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only edit your own posts" 
      });
    }

    if (content && content.trim()) {
      post.content = content.trim();
      
      const detectedUrl = detectUrl(content);
      if (detectedUrl) {
        try {
          const linkPreview = await generateLinkPreview(detectedUrl);
          if (linkPreview) {
            post.externalLink = {
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
        } catch (previewError) {
          console.log('Link preview update failed:', previewError.message);
        }
      } else {
        post.externalLink = null;
      }
    }

    if (req.file) {
      if (post.image) {
        try {
          const publicId = getPublicIdFromUrl(post.image);
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }
      
      try {
        post.image = await uploadToCloudinary(req.file.path, 'mentor_posts');
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error uploading image' 
        });
      }
    }

    await post.save();
    await post.populate('mentorId', 'name username image');

    res.json({
      success: true,
      message: "Post updated successfully",
      post: {
        _id: post._id,
        mentor: {
          _id: post.mentorId._id,
          name: post.mentorId.name,
          username: post.mentorId.username,
          image: post.mentorId.image,
        },
        content: post.content,
        image: post.image,
        externalLink: post.externalLink,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating mentor post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * DELETE /api/posts/:postId
 * Delete a mentor post (only the creator mentor)
 */
router.delete("/:postId", authenticateMentorJWT, async (req, res) => {
  try {
    const post = await MentorPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.mentorId.toString() !== req.mentor._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only delete your own posts" 
      });
    }

    if (post.image) {
      try {
        const publicId = getPublicIdFromUrl(post.image);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting image:', deleteError);
      }
    }

    await MentorPost.findByIdAndDelete(req.params.postId);

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting mentor post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/posts/:postId/like
 * Like/Unlike a mentor post (authenticated users only)
 */
router.post("/:postId/like", authenticateJWT, async (req, res) => {
  try {
    const post = await MentorPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const userId = req.user._id;
    const existingLikeIndex = post.likes.findIndex(
      like => like.userId && like.userId.toString() === userId.toString()
    );

    if (existingLikeIndex > -1) {
      post.likes.splice(existingLikeIndex, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push({ userId });
      post.likesCount = post.likesCount + 1;
    }

    await post.save();

    res.json({
      success: true,
      isLiked: existingLikeIndex === -1,
      likesCount: post.likesCount,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/posts/:postId/comment
 * Add a comment to a mentor post (authenticated users only)
 */
router.post("/:postId/comment", authenticateJWT, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment content is required" 
      });
    }

    const post = await MentorPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.comments.push({
      userId: req.user._id,
      content: content.trim(),
    });
    post.commentsCount = post.commentsCount + 1;

    await post.save();
    
    // Manually populate user data for the new comment (cross-connection population)
    const newComment = post.comments[post.comments.length - 1];
    const user = await populateUser(newComment.userId);
    newComment.userId = user;

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: {
        _id: newComment._id,
        user: populatedUser,
        content: newComment.content,
        createdAt: newComment.createdAt,
      },
      commentsCount: post.commentsCount,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/mentor-posts/:postId/repost
 * Repost a mentor post (authenticated users only)
 * Note: This creates a reference to the original post
 */
router.post("/:postId/repost", authenticateJWT, async (req, res) => {
  try {
    const originalPost = await MentorPost.findById(req.params.postId);

    if (!originalPost) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check if user already reposted this (check user's reposts array)
    // Refresh user to get latest reposts
    const user = await User.findById(req.user._id);
    const userReposts = user.reposts || [];
    const alreadyReposted = userReposts.some(
      repostId => repostId.toString() === req.params.postId
    );

    if (alreadyReposted) {
      // Unrepost
      user.reposts = userReposts.filter(
        repostId => repostId.toString() !== req.params.postId
      );
      originalPost.repostCount = Math.max(0, (originalPost.repostCount || 0) - 1);
      await user.save();
      await originalPost.save();

      return res.json({
        success: true,
        message: "Repost removed successfully",
        repostCount: originalPost.repostCount,
        isReposted: false,
      });
    }

    // Add repost to user's reposts array for profile display
    user.reposts.push(originalPost._id);
    
    // Increment repost count on original post
    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    
    await user.save();
    await originalPost.save();

    res.json({
      success: true,
      message: "Post reposted successfully",
      repostCount: originalPost.repostCount,
      isReposted: true,
    });
  } catch (error) {
    console.error("Error reposting:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;