const express = require("express");
const router = express.Router();
const Post = require("../models/postSchema");
const Mentor = require("../models/mentorSchema");
const User = require("../models/userSchema");
const { Users } = require("../db");

const apiCache = require('../middleware/apiCache');
const authenticateMentorJWT = require("../middleware/mentorAuth");
const authenticateJWT = require("../middleware/userAuth");
const { authenticateRequired } = require("../middleware/combinedAuth");
const upload = require('../middleware/multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { detectUrl, generateLinkPreview } = require('../utils/linkPreview');
const path = require('path');
const jwt = require('jsonwebtoken');
const { verifyAdminToken } = require('../middleware/adminAuth');

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
    const user = await UserModel.findById(userId).select('name image _id username').lean();
    return user ? {
      _id: user._id,
      name: user.name,
      image: user.image,
      username: user.username || null,
    } : null;
  } catch (error) {
    console.error('Error populating user:', error);
    return null;
  }
}

async function populateMentor(mentorId) {
  if (!mentorId) return null;
  try {
    const mentor = await Mentor.findById(mentorId).select('name image _id username').lean();
    return mentor ? {
      _id: mentor._id,
      name: mentor.name,
      image: mentor.image,
      username: mentor.username || null,
    } : null;
  } catch (error) {
    console.error('Error populating mentor:', error);
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

// Optional user/mentor resolver - OPTIMIZED: Using lean() for faster queries
async function getOptionalUser(req) {
  const token = req.cookies?.accessToken;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const Mentor = require('../models/mentorSchema');

    // Support both users and mentors
    if (decoded.role === 'mentor') {
      const mentor = await Mentor.findById(decoded.id || decoded._id)
        .select('following reposts _id')
        .lean();
      return mentor || null;
    } else {
      const user = await User.findById(decoded.id || decoded._id)
        .select('following reposts _id')
        .lean();
      return user || null;
    }
  } catch (err) {
    // Token invalid/expired - silently return null for public access
    // Only log in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.log('Token validation failed (optional user):', err.message);
    }
    return null;
  }
}

/**
 * GET /api/posts/admin
 * Admin: list all posts with basic author info
 */
router.get("/admin", verifyAdminToken, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('mentorId', 'name username image')
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        let author = null;

        if (post.mentorId) {
          author = {
            _id: post.mentorId._id,
            name: post.mentorId.name,
            username: post.mentorId.username,
            image: post.mentorId.image,
            role: 'mentor',
          };
        } else if (post.userId) {
          const user = await populateUser(post.userId);
          author = user
            ? { ...user, role: 'user' }
            : {
              _id: post.userId,
              name: null,
              username: null,
              image: null,
              role: 'user',
            };
        }

        return {
          _id: post._id,
          author,
          content: post.content,
          image: post.image,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

    res.json({
      success: true,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("Error fetching posts for admin:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


/**
 * GET /api/posts
 * Public: list posts (from both mentors and users)
 * Cached for 10 minutes to improve performance (user-specific cache)
 */
router.get("/", apiCache(600, { userSpecific: true }), async (req, res) => {
  try {
    const currentUser = await getOptionalUser(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('mentorId', 'name username image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // OPTIMIZED: Batch all user lookups to avoid N+1 queries
    // Collect all unique user IDs from:
    // 1. Post authors (userId field)
    // 2. Post likes
    const allUserIds = new Set();
    const postAuthorUserIds = [];

    posts.forEach(post => {
      // Collect post author user IDs
      if (post.userId) {
        allUserIds.add(post.userId.toString());
        postAuthorUserIds.push(post.userId.toString());
      }
      // Collect like user IDs
      (post.likes || []).forEach(like => {
        if (like.userId) allUserIds.add(like.userId.toString());
      });
    });

    // Batch fetch all users in one query
    const userIdsArray = Array.from(allUserIds);
    const usersMap = new Map();
    if (userIdsArray.length > 0) {
      const users = await User.find({ _id: { $in: userIdsArray } })
        .select('name image _id username')
        .lean();
      users.forEach(user => {
        usersMap.set(user._id.toString(), {
          _id: user._id,
          name: user.name,
          image: user.image,
          username: user.username || null,
        });
      });
    }

    // Format posts using the pre-fetched user data
    const formattedPosts = posts.map((post) => {
      // Map likes using pre-fetched users
      const populatedLikes = (post.likes || []).map(like => {
        if (like.userId) {
          const user = usersMap.get(like.userId.toString());
          return {
            ...like,
            userId: user || { _id: like.userId },
          };
        }
        return like;
      });

      // Get author information (mentor or user)
      let author = null;
      if (post.mentorId) {
        author = {
          _id: post.mentorId._id,
          name: post.mentorId.name,
          username: post.mentorId.username,
          image: post.mentorId.image,
        };
      } else if (post.userId) {
        const user = usersMap.get(post.userId.toString());
        author = user || {
          _id: post.userId,
          name: null,
          username: null,
          image: null,
        };
      }

      // Check if current user/mentor is following the author (can be user or mentor)
      let isFollowing = false;
      if (currentUser && currentUser.following) {
        if (post.mentorId) {
          isFollowing = currentUser.following.some(id => id.toString() === post.mentorId._id.toString());
        } else if (post.userId) {
          isFollowing = currentUser.following.some(id => id.toString() === post.userId.toString());
        }
      }

      // Check if user has reposted this
      const isReposted = currentUser && currentUser.reposts
        ? currentUser.reposts.some(id => id.toString() === post._id.toString())
        : false;

      // Check if current user/mentor liked this post
      // Handle both ObjectId directly or populated user object
      let isLiked = false;
      if (currentUser) {
        isLiked = (post.likes || []).some(like => {
          if (!like.userId) return false;
          // like.userId can be ObjectId directly (when using .lean()) or populated
          const likeUserId = like.userId._id ? like.userId._id.toString() : like.userId.toString();
          return likeUserId === currentUser._id.toString();
        });
      }

      return {
        _id: post._id,
        mentor: author, // Keep 'mentor' key for backward compatibility
        author: author, // Add 'author' key for clarity
        content: post.content,
        image: post.image,
        externalLink: post.externalLink,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        repostCount: post.repostCount || 0,
        isLiked,
        isFollowing,
        isReposted,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    const total = await Post.countDocuments();

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
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * GET /api/posts/user/:userId
 * Public: get all posts by a specific user
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const currentUser = await getOptionalUser(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Batch fetch all users
    const allUserIds = new Set();
    posts.forEach(post => {
      if (post.userId) {
        allUserIds.add(post.userId.toString());
      }
      (post.likes || []).forEach(like => {
        if (like.userId) allUserIds.add(like.userId.toString());
      });
    });

    const userIdsArray = Array.from(allUserIds);
    const usersMap = new Map();
    if (userIdsArray.length > 0) {
      const users = await User.find({ _id: { $in: userIdsArray } })
        .select('name image _id username')
        .lean();
      users.forEach(user => {
        usersMap.set(user._id.toString(), {
          _id: user._id,
          name: user.name,
          image: user.image,
          username: user.username || null,
        });
      });
    }

    const formattedPosts = posts.map((post) => {
      const populatedLikes = (post.likes || []).map(like => {
        if (like.userId) {
          const user = usersMap.get(like.userId.toString());
          return {
            ...like,
            userId: user || { _id: like.userId },
          };
        }
        return like;
      });

      const user = usersMap.get(post.userId?.toString());
      const author = user || {
        _id: post.userId,
        name: null,
        username: null,
        image: null,
      };

      const isReposted = currentUser && currentUser.reposts
        ? currentUser.reposts.some(id => id.toString() === post._id.toString())
        : false;

      return {
        _id: post._id,
        mentor: author,
        author: author,
        content: post.content,
        image: post.image,
        externalLink: post.externalLink,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        repostCount: post.repostCount || 0,
        isLiked: currentUser
          ? populatedLikes.some(
            like => like.userId && like.userId._id && like.userId._id.toString() === currentUser._id.toString()
          )
          : false,
        isFollowing: false,
        isReposted,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    const total = await Post.countDocuments({ userId: req.params.userId });

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
    console.error("Error fetching user posts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * GET /api/posts/mentor/:mentorId
 * Public: get all posts by a specific mentor
 */
router.get("/mentor/:mentorId", async (req, res) => {
  try {
    const currentUser = await getOptionalUser(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ mentorId: req.params.mentorId })
      .populate('mentorId', 'name username image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Batch fetch all users
    const allUserIds = new Set();
    posts.forEach(post => {
      (post.likes || []).forEach(like => {
        if (like.userId) allUserIds.add(like.userId.toString());
      });
    });

    const userIdsArray = Array.from(allUserIds);
    const usersMap = new Map();
    if (userIdsArray.length > 0) {
      const users = await User.find({ _id: { $in: userIdsArray } })
        .select('name image _id username')
        .lean();
      users.forEach(user => {
        usersMap.set(user._id.toString(), {
          _id: user._id,
          name: user.name,
          image: user.image,
          username: user.username || null,
        });
      });
    }

    const formattedPosts = posts.map((post) => {
      const populatedLikes = (post.likes || []).map(like => {
        if (like.userId) {
          const user = usersMap.get(like.userId.toString());
          return {
            ...like,
            userId: user || { _id: like.userId },
          };
        }
        return like;
      });

      const author = post.mentorId ? {
        _id: post.mentorId._id,
        name: post.mentorId.name,
        username: post.mentorId.username,
        image: post.mentorId.image,
      } : null;

      // Check if current user/mentor is following the author (can be user or mentor)
      let isFollowing = false;
      if (currentUser && currentUser.following && post.mentorId) {
        isFollowing = currentUser.following.some(id => id.toString() === post.mentorId._id.toString());
      }

      const isReposted = currentUser && currentUser.reposts
        ? currentUser.reposts.some(id => id.toString() === post._id.toString())
        : false;

      // Check if current user/mentor liked this post
      // Handle both ObjectId directly or populated user object
      let isLiked = false;
      if (currentUser) {
        isLiked = (post.likes || []).some(like => {
          if (!like.userId) return false;
          // like.userId can be ObjectId directly (when using .lean()) or populated
          const likeUserId = like.userId._id ? like.userId._id.toString() : like.userId.toString();
          return likeUserId === currentUser._id.toString();
        });
      }

      return {
        _id: post._id,
        mentor: author,
        author: author,
        content: post.content,
        image: post.image,
        externalLink: post.externalLink,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        repostCount: post.repostCount || 0,
        isLiked,
        isFollowing,
        isReposted,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    const total = await Post.countDocuments({ mentorId: req.params.mentorId });

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
 * Public: single post (from mentor or user)
 */
router.get("/:postId", async (req, res) => {
  try {
    const currentUser = await getOptionalUser(req);

    const post = await Post.findById(req.params.postId)
      .populate('mentorId', 'name username image bio tagline')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // OPTIMIZED: Batch all user lookups to avoid N+1 queries
    // Collect all unique user IDs from:
    // 1. Post author (userId field)
    // 2. Likes
    // 3. Comments and replies
    const allUserIds = new Set();

    // Collect post author user ID
    if (post.userId) {
      allUserIds.add(post.userId.toString());
    }

    // Collect from likes
    (post.likes || []).forEach(like => {
      if (like.userId) allUserIds.add(like.userId.toString());
    });

    // Collect from comments and replies
    const allComments = (post.comments || []).filter(c => !c.deleted);
    allComments.forEach(comment => {
      if (comment.userId) allUserIds.add(comment.userId.toString());
    });

    // Batch fetch all users and mentors in parallel queries
    // Comments can be from either users or mentors
    const userIdsArray = Array.from(allUserIds);
    const usersMap = new Map();
    if (userIdsArray.length > 0) {
      // Query both User and Mentor models since comment.userId can be either
      const UserModel = Users.model('Users');
      const [users, mentors] = await Promise.all([
        UserModel.find({ _id: { $in: userIdsArray } })
          .select('name image _id username')
          .lean(),
        Mentor.find({ _id: { $in: userIdsArray } })
          .select('name image _id username')
          .lean()
      ]);

      // Add users to map
      users.forEach(user => {
        usersMap.set(user._id.toString(), {
          _id: user._id,
          name: user.name,
          image: user.image,
          username: user.username || null,
        });
      });

      // Add mentors to map (will override users if same ID, but shouldn't happen)
      mentors.forEach(mentor => {
        usersMap.set(mentor._id.toString(), {
          _id: mentor._id,
          name: mentor.name,
          image: mentor.image,
          username: mentor.username || null,
        });
      });
    }

    // Populate likes using pre-fetched users
    const populatedLikes = (post.likes || []).map(like => {
      if (like.userId) {
        const user = usersMap.get(like.userId.toString());
        return {
          _id: like._id,
          user: user || { _id: like.userId },
          createdAt: like.createdAt,
        };
      }
      return like;
    });

    // Organize comments by parent/child
    const topLevelComments = allComments.filter(c => !c.parentCommentId);

    // Populate comments using pre-fetched users
    const populatedComments = topLevelComments.map(comment => {
      const populatedUser = comment.userId
        ? (usersMap.get(comment.userId.toString()) || { _id: comment.userId })
        : null;

      // Get replies for this comment
      const replies = allComments.filter(c =>
        c.parentCommentId && c.parentCommentId.toString() === comment._id.toString()
      );

      const populatedReplies = replies.map(reply => {
        const replyUser = reply.userId
          ? (usersMap.get(reply.userId.toString()) || { _id: reply.userId })
          : null;

        const isLiked = currentUser && reply.likes
          ? reply.likes.some(like =>
            like.userId && like.userId.toString() === currentUser._id.toString()
          )
          : false;

        return {
          _id: reply._id,
          user: replyUser,
          content: reply.content,
          likesCount: reply.likesCount || 0,
          isLiked,
          parentCommentId: reply.parentCommentId,
          createdAt: reply.createdAt,
        };
      });

      const isLiked = currentUser && comment.likes
        ? comment.likes.some(like =>
          like.userId && like.userId.toString() === currentUser._id.toString()
        )
        : false;

      return {
        _id: comment._id,
        user: populatedUser,
        content: comment.content,
        likesCount: comment.likesCount || 0,
        isLiked,
        replies: populatedReplies,
        createdAt: comment.createdAt,
      };
    });

    // Get author information (mentor or user)
    let author = null;
    if (post.mentorId) {
      author = {
        _id: post.mentorId._id,
        name: post.mentorId.name,
        username: post.mentorId.username,
        image: post.mentorId.image,
        bio: post.mentorId.bio,
        tagline: post.mentorId.tagline,
      };
    } else if (post.userId) {
      const user = usersMap.get(post.userId.toString());
      author = user || {
        _id: post.userId,
        name: null,
        username: null,
        image: null,
        bio: null,
        tagline: null,
      };
    }

    // Check if current user/mentor is following the author (can be user or mentor)
    let isFollowing = false;
    if (currentUser && currentUser.following && author) {
      isFollowing = currentUser.following.some(id => id.toString() === author._id.toString());
    }

    // Check if user has reposted this
    const isReposted = currentUser && currentUser.reposts
      ? currentUser.reposts.some(id => id.toString() === post._id.toString())
      : false;

    const formattedPost = {
      _id: post._id,
      mentor: author, // Keep 'mentor' key for backward compatibility
      author: author, // Add 'author' key for clarity
      content: post.content,
      image: post.image,
      externalLink: post.externalLink,
      likes: populatedLikes,
      likesCount: post.likesCount,
      comments: populatedComments,
      commentsCount: post.commentsCount,
      repostCount: post.repostCount || 0,
      isLiked: currentUser
        ? populatedLikes.some(
          like => like.user && like.user._id && like.user._id.toString() === currentUser._id.toString()
        )
        : false,
      isFollowing,
      isReposted,
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
 * Create a new post (mentors and users)
 */
router.post("/", authenticateRequired, upload.single("image"), async (req, res) => {
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
        imageUrl = await uploadToCloudinary(req.file.path, 'posts');
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image'
        });
      }
    }

    // Create post - support both mentors and users
    const postData = {
      content: content.trim(),
      image: imageUrl,
    };

    if (req.mentor) {
      postData.mentorId = req.mentor._id;
    } else if (req.user) {
      postData.userId = req.user._id;
    }

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

    const post = new Post(postData);
    await post.save();

    // Populate the appropriate author (mentor or user)
    if (post.mentorId) {
      await post.populate('mentorId', 'name username image');
    } else if (post.userId) {
      // Manually populate user since it's on a different connection
      const user = await populateUser(post.userId);
      post.userId = user;
    }

    // Format response based on author type
    const author = post.mentorId
      ? {
        _id: post.mentorId._id,
        name: post.mentorId.name,
        username: post.mentorId.username,
        image: post.mentorId.image,
      }
      : post.userId
        ? {
          _id: post.userId._id,
          name: post.userId.name,
          username: post.userId.username || null,
          image: post.userId.image,
        }
        : null;

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: {
        _id: post._id,
        mentor: author, // Keep 'mentor' key for backward compatibility
        author: author, // Add 'author' key for clarity
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
    console.error("Error creating post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * PUT /api/posts/:postId
 * Update a post (only the creator - mentor or user)
 */
router.put("/:postId", authenticateRequired, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check authorization: user must be the creator
    const isAuthorized =
      (req.mentor && post.mentorId && post.mentorId.toString() === req.mentor._id.toString()) ||
      (req.user && post.userId && post.userId.toString() === req.user._id.toString());

    if (!isAuthorized) {
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
        post.image = await uploadToCloudinary(req.file.path, 'posts');
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image'
        });
      }
    }

    await post.save();

    // Populate the appropriate author (mentor or user)
    if (post.mentorId) {
      await post.populate('mentorId', 'name username image');
    } else if (post.userId) {
      const user = await populateUser(post.userId);
      post.userId = user;
    }

    // Format response based on author type
    const author = post.mentorId
      ? {
        _id: post.mentorId._id,
        name: post.mentorId.name,
        username: post.mentorId.username,
        image: post.mentorId.image,
      }
      : post.userId
        ? {
          _id: post.userId._id,
          name: post.userId.name,
          username: post.userId.username || null,
          image: post.userId.image,
        }
        : null;

    res.json({
      success: true,
      message: "Post updated successfully",
      post: {
        _id: post._id,
        mentor: author, // Keep 'mentor' key for backward compatibility
        author: author, // Add 'author' key for clarity
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
    console.error("Error updating post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * DELETE /api/posts/:postId
 * Delete a post (only the creator - mentor or user)
 */
router.delete("/:postId", authenticateRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check authorization: user must be the creator
    const isAuthorized =
      (req.mentor && post.mentorId && post.mentorId.toString() === req.mentor._id.toString()) ||
      (req.user && post.userId && post.userId.toString() === req.user._id.toString());

    if (!isAuthorized) {
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

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting mentor post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * DELETE /api/posts/admin/:postId
 * Admin: delete any post
 */
router.delete("/admin/:postId", verifyAdminToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.image) {
      try {
        const publicId = getPublicIdFromUrl(post.image);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting image (admin):', deleteError);
      }
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post (admin):", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/posts/:postId/like
 * Like/Unlike a post (authenticated users and mentors)
 */
router.post("/:postId/like", authenticateRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Support both user and mentor authentication
    const userId = req.user ? req.user._id : req.mentor._id;
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

    // Clear cache for posts feed to ensure fresh data on next load
    // Clear all user-specific caches for /api/posts
    apiCache.clear('/api/posts');

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
router.post("/:postId/comment", authenticateRequired, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.comments.push({
      userId: req.user ? req.user._id : req.mentor._id,
      content: content.trim(),
      likes: [],
      likesCount: 0,
      parentCommentId: null,
      deleted: false,
    });
    post.commentsCount = post.commentsCount + 1;

    await post.save();

    // Manually populate user data for the new comment (cross-connection population)
    const newComment = post.comments[post.comments.length - 1];
    const user = req.user ? await populateUser(newComment.userId) : await populateMentor(newComment.userId);
    const userData = user || { _id: newComment.userId };

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: {
        _id: newComment._id,
        user: userData,
        content: newComment.content,
        likesCount: newComment.likesCount || 0,
        isLiked: false,
        replies: [],
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
router.post("/:postId/repost", authenticateRequired, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.postId);

    if (!originalPost) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check if user already reposted this (check user's reposts array)
    // Refresh user to get latest reposts
    const user = req.user ? await User.findById(req.user._id) : await Mentor.findById(req.mentor._id);
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
    // Ensure reposts array is initialized
    if (!user?.reposts) {
      user.reposts = [];
    }
    user.reposts.push(originalPost._id.toString());

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

/**
 * POST /api/mentor-posts/:postId/comments/:commentId/like
 * Like/Unlike a comment (authenticated users and mentors)
 */
router.post("/:postId/comments/:commentId/like", authenticateRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment || comment.deleted) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Support both user and mentor authentication
    const userId = req.user ? req.user._id : req.mentor._id;
    const existingLikeIndex = comment.likes.findIndex(
      like => like.userId && like.userId.toString() === userId.toString()
    );

    if (existingLikeIndex > -1) {
      // Unlike
      comment.likes.splice(existingLikeIndex, 1);
      comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
    } else {
      // Like
      comment.likes.push({ userId });
      comment.likesCount = (comment.likesCount || 0) + 1;
    }

    await post.save();

    res.json({
      success: true,
      isLiked: existingLikeIndex === -1,
      likesCount: comment.likesCount,
    });
  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/mentor-posts/:postId/comments/:commentId/reply
 * Reply to a comment (authenticated users only)
 */
router.post("/:postId/comments/:commentId/reply", authenticateRequired, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required"
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const parentComment = post.comments.id(req.params.commentId);
    if (!parentComment || parentComment.deleted) {
      return res.status(404).json({ success: false, message: "Parent comment not found" });
    }

    // Create reply
    const reply = {
      userId: req.user ? req.user._id : req.mentor._id,
      content: content.trim(),
      parentCommentId: req.params.commentId,
      likes: [],
      likesCount: 0,
      deleted: false,
    };

    post.comments.push(reply);
    post.commentsCount = post.commentsCount + 1;

    await post.save();

    // Get the newly added reply
    const newReply = post.comments[post.comments.length - 1];

    // Manually populate the reply's user data (cross-DB population)
    const populatedUser = req.user
      ? await populateUser(newReply.userId)
      : await populateMentor(newReply.userId);

    const userData = populatedUser || { _id: newReply.userId };

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      reply: {
        _id: newReply._id,
        user: userData,
        content: newReply.content,
        likesCount: newReply.likesCount,
        isLiked: false,
        parentCommentId: newReply.parentCommentId,
        createdAt: newReply.createdAt,
      },
      commentsCount: post.commentsCount,
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * DELETE /api/mentor-posts/:postId/comments/:commentId
 * Delete a comment (only by the comment author)
 */
router.delete("/:postId/comments/:commentId", authenticateRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Check if user is the author
    const userId = req.user ? req.user._id : req.mentor._id;
    if (comment.userId?.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments"
      });
    }

    // Soft delete the comment
    comment.deleted = true;
    post.commentsCount = Math.max(0, post.commentsCount - 1);

    await post.save();

    res.json({
      success: true,
      message: "Comment deleted successfully",
      commentsCount: post.commentsCount,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;