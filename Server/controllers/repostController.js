const Post = require('../models/postSchema');
const { detectUrl, generateLinkPreview } = require('../utils/linkPreview');

/**
 * POST /api/posts/:postId/repost
 * Repost a post (creates new post referencing original)
 */
exports.repost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body; // Optional: add comment to repost
    
    // Get current user
    const user = req.user || req.mentor;
    const userType = req.user ? 'User' : 'Mentor';
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    // Check if original post exists
    const originalPost = await Post.findById(postId);
    if (!originalPost || originalPost.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found',
      });
    }
    
    // Prevent reposting own post (optional - can be removed if desired)
    if (originalPost.author.toString() === user._id.toString() && originalPost.authorType === userType) {
      return res.status(400).json({
        success: false,
        message: 'You cannot repost your own post',
      });
    }
    
    // Check if user already reposted this (optional - can allow multiple reposts)
    const existingRepost = await Post.findOne({
      author: user._id,
      authorType: userType,
      repostOf: postId,
      deleted: false,
    });
    
    if (existingRepost) {
      return res.status(409).json({
        success: false,
        message: 'You have already reposted this',
      });
    }
    
    // Create repost
    const repostData = {
      author: user._id,
      authorType: userType,
      repostOf: postId,
      content: content ? content.trim() : '', // Optional comment
    };
    
    // Handle link preview if content provided
    if (content) {
      const detectedUrl = detectUrl(content);
      if (detectedUrl) {
        try {
          const linkPreview = await generateLinkPreview(detectedUrl);
          if (linkPreview) {
            repostData.externalLink = {
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
          console.log('Link preview generation failed:', previewError.message);
        }
      }
    }
    
    const repost = new Post(repostData);
    await repost.save();
    
    // Increment repostCount on original post (atomic)
    await Post.findByIdAndUpdate(
      postId,
      { $inc: { repostCount: 1 } },
      { new: true }
    );
    
    // Populate author for response
    const { populateAuthor } = require('./postController');
    const author = await populateAuthor(repost);
    
    // Get original post author
    const originalAuthor = await populateAuthor(originalPost);
    
    res.status(201).json({
      success: true,
      message: 'Post reposted successfully',
      repost: {
        _id: repost._id,
        author,
        authorType: repost.authorType,
        content: repost.content,
        repostOf: repost.repostOf,
        repostOriginal: {
          _id: originalPost._id,
          content: originalPost.content,
          image: originalPost.image,
          author: originalAuthor,
        },
        voteScore: repost.voteScore,
        commentCount: repost.commentCount,
        repostCount: repost.repostCount,
        createdAt: repost.createdAt,
        updatedAt: repost.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error reposting:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};




