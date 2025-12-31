const Vote = require('../models/voteSchema');
const Post = require('../models/postSchema');

/**
 * POST /api/posts/:postId/vote
 * Vote on a post (upvote or downvote)
 * Enforces one vote per user per post
 */
exports.votePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { value } = req.body; // 1 for upvote, -1 for downvote
    
    if (![1, -1].includes(value)) {
      return res.status(400).json({
        success: false,
        message: 'Vote value must be 1 (upvote) or -1 (downvote)',
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
    
    // Check for existing vote
    const existingVote = await Vote.findOne({
      post: postId,
      user: user._id,
      userType,
    });
    
    let finalVote;
    
    if (existingVote) {
      // If same vote, remove it (toggle off)
      if (existingVote.value === value) {
        await Vote.findByIdAndDelete(existingVote._id);
        // Vote score will be updated by middleware
        finalVote = null;
      } else {
        // Change vote (upvote to downvote or vice versa)
        existingVote.value = value;
        await existingVote.save();
        // Vote score will be updated by middleware
        finalVote = value;
      }
    } else {
      // Create new vote
      const newVote = new Vote({
        post: postId,
        user: user._id,
        userType,
        value,
      });
      await newVote.save();
      // Vote score will be updated by middleware
      finalVote = value;
    }
    
    // Get updated vote score
    const updatedPost = await Post.findById(postId);
    
    res.json({
      success: true,
      userVote: finalVote,
      voteScore: updatedPost.voteScore,
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    
    // Handle duplicate vote error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vote already exists',
      });
    }
    
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


