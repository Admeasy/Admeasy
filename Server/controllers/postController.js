const Post = require('../models/postSchema');
const Vote = require('../models/voteSchema');
const Comment = require('../models/commentSchema');
const { Admeasy, Users } = require('../db');

/**
 * Helper: Get User or Mentor model based on type
 * Handles cross-DB population
 */
async function getAuthorModel(authorType) {
  if (authorType === 'User') {
    return Users.model('Users');
  } else if (authorType === 'Mentor') {
    return Admeasy.model('Mentor');
  }
  throw new Error(`Invalid authorType: ${authorType}`);
}

/**
 * Helper: Populate author with minimal fields
 * Returns consistent author object regardless of type
 */
async function populateAuthor(post) {
  if (!post.author || !post.authorType) return null;
  
  try {
    const Model = await getAuthorModel(post.authorType);
    const author = await Model.findById(post.author).lean();
    
    if (!author) return null;
    
    // Return consistent structure
    return {
      _id: author._id,
      name: author.name || 'Unknown',
      username: author.username || null,
      image: author.image || null,
      // Mentor-specific fields
      ...(post.authorType === 'Mentor' && {
        bio: author.bio || null,
        tagline: author.tagline || null,
      }),
    };
  } catch (error) {
    console.error('Error populating author:', error);
    return null;
  }
}

/**
 * Helper: Get user's vote on a post
 */
async function getUserVote(postId, userId, userType) {
  if (!userId || !userType) return null;
  
  try {
    const vote = await Vote.findOne({
      post: postId,
      user: userId,
      userType,
    }).lean();
    
    return vote ? vote.value : null;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
}

/**
 * GET /api/posts
 * Get feed of posts (paginated, sorted by voteScore or createdAt)
 */
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt'; // 'createdAt' or 'voteScore'
    
    // Get current user (optional)
    const currentUser = req.user || req.mentor || null;
    const userType = req.user ? 'User' : req.mentor ? 'Mentor' : null;
    
    // Build query
    const query = { deleted: false };
    
    // Sort
    const sort = sortBy === 'voteScore' 
      ? { voteScore: -1, createdAt: -1 }
      : { createdAt: -1 };
    
    // Fetch posts
    const posts = await Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Populate authors and get user votes in parallel
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const [author, userVote] = await Promise.all([
          populateAuthor(post),
          currentUser ? getUserVote(post._id, currentUser._id, userType) : null,
        ]);
        
        // Get repost original if exists
        let repostOriginal = null;
        if (post.repostOf) {
          const original = await Post.findById(post.repostOf).lean();
          if (original && !original.deleted) {
            repostOriginal = {
              _id: original._id,
              content: original.content,
              image: original.image,
              author: await populateAuthor(original),
            };
          }
        }
        
        return {
          _id: post._id,
          author,
          authorType: post.authorType,
          content: post.content,
          image: post.image,
          externalLink: post.externalLink,
          repostOf: post.repostOf,
          repostOriginal,
          voteScore: post.voteScore,
          commentCount: post.commentCount,
          repostCount: post.repostCount,
          userVote, // null, 1 (upvoted), or -1 (downvoted)
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );
    
    const total = await Post.countDocuments(query);
    
    res.json({
      success: true,
      posts: postsWithAuthors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * GET /api/posts/:postId
 * Get single post with full details
 */
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Get current user (optional)
    const currentUser = req.user || req.mentor || null;
    const userType = req.user ? 'User' : req.mentor ? 'Mentor' : null;
    
    const post = await Post.findOne({ _id: postId, deleted: false }).lean();
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Populate author and get user vote
    const [author, userVote] = await Promise.all([
      populateAuthor(post),
      currentUser ? getUserVote(post._id, currentUser._id, userType) : null,
    ]);
    
    // Get repost original if exists
    let repostOriginal = null;
    if (post.repostOf) {
      const original = await Post.findById(post.repostOf).lean();
      if (original && !original.deleted) {
        repostOriginal = {
          _id: original._id,
          content: original.content,
          image: original.image,
          author: await populateAuthor(original),
        };
      }
    }
    
    res.json({
      success: true,
      post: {
        _id: post._id,
        author,
        authorType: post.authorType,
        content: post.content,
        image: post.image,
        externalLink: post.externalLink,
        repostOf: post.repostOf,
        repostOriginal,
        voteScore: post.voteScore,
        commentCount: post.commentCount,
        repostCount: post.repostCount,
        userVote,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * POST /api/posts
 * Create a new post (User or Mentor)
 */
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }
    
    // Determine author from auth middleware
    const author = req.user || req.mentor;
    const authorType = req.user ? 'User' : 'Mentor';
    
    if (!author) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    // Handle image upload (if provided)
    let imageUrl = null;
    if (req.file) {
      const { uploadToCloudinary } = require('../utils/cloudinary');
      try {
        imageUrl = await uploadToCloudinary(req.file.path, 'posts');
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
        });
      }
    }
    
    // Handle link preview (if URL detected)
    let linkPreview = null;
    if (content) {
      const { detectUrl, generateLinkPreview } = require('../utils/linkPreview');
      const detectedUrl = detectUrl(content);
      if (detectedUrl) {
        try {
          linkPreview = await generateLinkPreview(detectedUrl);
        } catch (previewError) {
          console.log('Link preview generation failed:', previewError.message);
        }
      }
    }
    
    // Create post
    const postData = {
      author: author._id,
      authorType,
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
    
    const post = new Post(postData);
    await post.save();
    
    // Populate author for response
    const authorData = await populateAuthor(post);
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        _id: post._id,
        author: authorData,
        authorType: post.authorType,
        content: post.content,
        image: post.image,
        externalLink: post.externalLink,
        voteScore: post.voteScore,
        commentCount: post.commentCount,
        repostCount: post.repostCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * PUT /api/posts/:postId
 * Update a post (only by author)
 */
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    
    const post = await Post.findById(postId);
    
    if (!post || post.deleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Check authorization
    const author = req.user || req.mentor;
    const authorType = req.user ? 'User' : 'Mentor';
    
    if (!author || post.author.toString() !== author._id.toString() || post.authorType !== authorType) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts',
      });
    }
    
    // Update content
    if (content && content.trim()) {
      post.content = content.trim();
      
      // Update link preview if URL detected
      const { detectUrl, generateLinkPreview } = require('../utils/linkPreview');
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
    
    // Handle image update
    if (req.file) {
      const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
      const path = require('path');
      
      // Delete old image
      if (post.image) {
        try {
          const parts = post.image.split('/upload/');
          if (parts.length >= 2) {
            const publicIdWithExtension = parts[1];
            const extensionName = path.extname(publicIdWithExtension);
            const publicId = publicIdWithExtension.replace(extensionName, '');
            await deleteFromCloudinary(publicId);
          }
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }
      
      // Upload new image
      try {
        post.image = await uploadToCloudinary(req.file.path, 'posts');
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
        });
      }
    }
    
    await post.save();
    
    const authorData = await populateAuthor(post);
    
    res.json({
      success: true,
      message: 'Post updated successfully',
      post: {
        _id: post._id,
        author: authorData,
        authorType: post.authorType,
        content: post.content,
        image: post.image,
        externalLink: post.externalLink,
        voteScore: post.voteScore,
        commentCount: post.commentCount,
        repostCount: post.repostCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * DELETE /api/posts/:postId
 * Soft delete a post (only by author)
 */
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId);
    
    if (!post || post.deleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Check authorization
    const author = req.user || req.mentor;
    const authorType = req.user ? 'User' : 'Mentor';
    
    if (!author || post.author.toString() !== author._id.toString() || post.authorType !== authorType) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
      });
    }
    
    // Soft delete
    post.deleted = true;
    await post.save();
    
    // Optionally delete image from Cloudinary
    if (post.image) {
      try {
        const { deleteFromCloudinary } = require('../utils/cloudinary');
        const path = require('path');
        const parts = post.image.split('/upload/');
        if (parts.length >= 2) {
          const publicIdWithExtension = parts[1];
          const extensionName = path.extname(publicIdWithExtension);
          const publicId = publicIdWithExtension.replace(extensionName, '');
          await deleteFromCloudinary(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting image:', deleteError);
      }
    }
    
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


