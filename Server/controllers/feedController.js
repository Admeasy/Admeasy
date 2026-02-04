const PostView = require('../models/postViewSchema');
const UserKeywordAffinity = require('../models/userKeywordAffinitySchema');
const { extractKeywords } = require('../utils/feedRanking');

/**
 * Track post view
 * POST /api/posts/:postId/view
 * 
 * Marks a post as SEEN when:
 * - Post entered viewport
 * - Stayed visible ≥ 1000ms
 * - Had ≥ 50% visibility
 * 
 * State progression: UNSEEN → SEEN → ENGAGED (never downgrades)
 */
const trackPostView = async (req, res) => {
  try {
    const { postId } = req.params;
    const { viewDuration, viewportPercentage } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Validate view tracking data
    if (typeof viewDuration !== 'number' || viewDuration < 1000) {
      return res.status(400).json({
        success: false,
        message: 'View duration must be at least 1000ms',
      });
    }

    if (typeof viewportPercentage !== 'number' || viewportPercentage < 50) {
      return res.status(400).json({
        success: false,
        message: 'Viewport percentage must be at least 50%',
      });
    }

    // Find or create post view record
    let postView = await PostView.findOne({
      userId,
      postId,
    });

    if (!postView) {
      postView = new PostView({
        userId,
        postId,
        state: 'UNSEEN',
      });
    }

    // Upgrade to SEEN if conditions are met and not already ENGAGED
    if (postView.state !== 'ENGAGED') {
      postView.upgradeState('SEEN', {
        viewDuration,
        viewportPercentage,
        firstSeenAt: postView.firstSeenAt || new Date(),
      });
      await postView.save();
    }

    res.json({
      success: true,
      state: postView.state,
      message: 'View tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking post view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view',
    });
  }
};

/**
 * Mark post as engaged
 * Called automatically when user likes, comments, saves, shares, or reposts
 * 
 * @param {String} userId - User ID
 * @param {String} postId - Post ID
 * @param {String} engagementType - Type: 'like', 'comment', 'save', 'share', 'repost'
 * @param {Object} post - Post object (for keyword extraction)
 */
const markPostAsEngaged = async (userId, postId, engagementType, post = null) => {
  try {
    if (!userId || !postId) return;

    // Find or create post view record
    let postView = await PostView.findOne({
      userId,
      postId,
    });

    if (!postView) {
      postView = new PostView({
        userId,
        postId,
        state: 'UNSEEN',
      });
    }

    // Upgrade to ENGAGED (will also upgrade UNSEEN → SEEN if needed)
    postView.upgradeState('ENGAGED', {
      engagementType,
      engagedAt: new Date(),
    });
    await postView.save();

    // Extract keywords and update user affinity if post content is available
    if (post && post.content) {
      await updateKeywordAffinity(userId, post, engagementType);
    }
  } catch (error) {
    console.error('Error marking post as engaged:', error);
    // Don't throw - this is a background operation
  }
};

/**
 * Update user keyword affinity based on engagement
 * @param {String} userId - User ID
 * @param {Object} post - Post object
 * @param {String} engagementType - Type of engagement
 */
const updateKeywordAffinity = async (userId, post, engagementType) => {
  try {
    const keywords = extractKeywords(post.content || '');

    if (keywords.length === 0) return;

    // Update affinity for each keyword
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase().trim();

      let affinity = await UserKeywordAffinity.findOne({
        userId,
        keyword: normalizedKeyword,
      });

      if (affinity) {
        // Increment existing affinity
        affinity.incrementWeight();
        await affinity.save();
      } else {
        // Create new affinity
        affinity = new UserKeywordAffinity({
          userId,
          keyword: normalizedKeyword,
          weight: 1,
          engagementCount: 1,
        });
        await affinity.save();
      }
    }
  } catch (error) {
    console.error('Error updating keyword affinity:', error);
    // Don't throw - this is a background operation
  }
};

/**
 * Get post view state for a user
 * GET /api/posts/:postId/view-state
 */
const getPostViewState = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.json({
        success: true,
        state: 'UNSEEN', // Default for unauthenticated
      });
    }

    const postView = await PostView.findOne({
      userId,
      postId,
    }).lean();

    res.json({
      success: true,
      state: postView?.state || 'UNSEEN',
    });
  } catch (error) {
    console.error('Error getting post view state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get view state',
    });
  }
};

module.exports = {
  trackPostView,
  markPostAsEngaged,
  updateKeywordAffinity,
  getPostViewState,
};
