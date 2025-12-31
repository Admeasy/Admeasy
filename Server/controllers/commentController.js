const Comment = require('../models/commentSchema');
const Post = require('../models/postSchema');
const { Admeasy, Users } = require('../db');

/**
 * Helper: Populate comment author
 */
async function populateCommentAuthor(comment) {
  if (!comment.author || !comment.authorType) return null;
  
  try {
    const Model = comment.authorType === 'User' 
      ? Users.model('Users')
      : Admeasy.model('Mentor');
    
    const author = await Model.findById(comment.author).lean();
    
    if (!author) return null;
    
    return {
      _id: author._id,
      name: author.name || 'Unknown',
      username: author.username || null,
      image: author.image || null,
    };
  } catch (error) {
    console.error('Error populating comment author:', error);
    return null;
  }
}

/**
 * GET /api/posts/:postId/comments
 * Get comments for a post (with optional nested replies)
 */
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { parentCommentId } = req.query; // Optional: get replies to a specific comment
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post || post.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }
    
    // Build query
    const query = {
      post: postId,
      deleted: false,
    };
    
    if (parentCommentId) {
      // Get nested replies
      query.parentComment = parentCommentId;
    } else {
      // Get top-level comments only
      query.parentComment = null;
    }
    
    // Fetch comments
    const comments = await Comment.find(query)
      .sort({ createdAt: 1 })
      .lean();
    
    // Populate authors
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await populateCommentAuthor(comment);
        
        // Get reply count
        const replyCount = await Comment.countDocuments({
          parentComment: comment._id,
          deleted: false,
        });
        
        return {
          _id: comment._id,
          author,
          authorType: comment.authorType,
          content: comment.content,
          parentComment: comment.parentComment,
          replyCount,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        };
      })
    );
    
    res.json({
      success: true,
      comments: commentsWithAuthors,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * POST /api/posts/:postId/comments
 * Create a comment (or reply to a comment)
 */
exports.createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }
    
    // Get current user
    const user = req.user || req.mentor;
    const userType = req.user ? 'User' : 'Mentor';
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post || post.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }
    
    // If parentCommentId provided, verify it exists and belongs to same post
    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        _id: parentCommentId,
        post: postId,
        deleted: false,
      });
      
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
        });
      }
    }
    
    // Create comment
    const comment = new Comment({
      post: postId,
      author: user._id,
      authorType: userType,
      content: content.trim(),
      parentComment: parentCommentId || null,
    });
    
    await comment.save();
    
    // Comment count will be updated by middleware
    
    // Populate author for response
    const author = await populateCommentAuthor(comment);
    
    // Get reply count (0 for new comments)
    const replyCount = 0;
    
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment: {
        _id: comment._id,
        author,
        authorType: comment.authorType,
        content: comment.content,
        parentComment: comment.parentComment,
        replyCount,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * PUT /api/comments/:commentId
 * Update a comment (only by author)
 */
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }
    
    const comment = await Comment.findById(commentId);
    
    if (!comment || comment.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }
    
    // Check authorization
    const user = req.user || req.mentor;
    const userType = req.user ? 'User' : 'Mentor';
    
    if (!user || comment.author.toString() !== user._id.toString() || comment.authorType !== userType) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments',
      });
    }
    
    // Update comment
    comment.content = content.trim();
    await comment.save();
    
    const author = await populateCommentAuthor(comment);
    
    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: {
        _id: comment._id,
        author,
        authorType: comment.authorType,
        content: comment.content,
        parentComment: comment.parentComment,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * DELETE /api/comments/:commentId
 * Soft delete a comment (only by author)
 */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment || comment.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }
    
    // Check authorization
    const user = req.user || req.mentor;
    const userType = req.user ? 'User' : 'Mentor';
    
    if (!user || comment.author.toString() !== user._id.toString() || comment.authorType !== userType) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }
    
    // Soft delete
    comment.deleted = true;
    await comment.save();
    
    // Comment count will be updated by middleware
    
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


