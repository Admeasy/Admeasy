const express = require("express");
const router = express.Router();
const MentorPost = require("../models/mentorPostSchema");
const Mentor = require("../models/mentorSchema");
const User = require("../models/userSchema");
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

// Optional user resolver - FIXED: Better error handling
async function getOptionalUser(req) {
  const token = req.cookies?.accessToken;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.role && decoded.role === 'mentor') return null;
    const user = await User.findById(decoded.id || decoded._id);
    return user || null;
  } catch (err) {
    // Token invalid/expired - silently return null for public access
    console.log('Token validation failed (optional user):', err.message);
    return null;
  }
}

/**
 * GET /api/mentor-posts
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
      .populate('likes.userId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedPosts = posts.map(post => ({
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
 * GET /api/mentor-posts/:postId
 * Public: single mentor post
 */
router.get("/:postId", async (req, res) => {
  try {
    const currentUser = await getOptionalUser(req);
    const post = await MentorPost.findById(req.params.postId)
      .populate('mentorId', 'name username image bio tagline')
      .populate('likes.userId', 'name image')
      .populate('comments.userId', 'name image')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

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
      likes: post.likes.map(like => ({
        _id: like._id,
        user: {
          _id: like.userId._id,
          name: like.userId.name,
          image: like.userId.image,
        },
        createdAt: like.createdAt,
      })),
      likesCount: post.likesCount,
      comments: post.comments.map(comment => ({
        _id: comment._id,
        user: {
          _id: comment.userId._id,
          name: comment.userId.name,
          image: comment.userId.image,
        },
        content: comment.content,
        createdAt: comment.createdAt,
      })),
      commentsCount: post.commentsCount,
      isLiked: currentUser
        ? post.likes.some(
            like => like.userId && like.userId._id.toString() === currentUser._id.toString()
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
 * POST /api/mentor-posts
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
 * PUT /api/mentor-posts/:postId
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
 * DELETE /api/mentor-posts/:postId
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
 * POST /api/mentor-posts/:postId/like
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
 * POST /api/mentor-posts/:postId/comment
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
    await post.populate('comments.userId', 'name image');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: {
        _id: newComment._id,
        user: {
          _id: newComment.userId._id,
          name: newComment.userId.name,
          image: newComment.userId.image,
        },
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

module.exports = router;