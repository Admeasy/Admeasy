/**
 * Feed Ranking Algorithm V1
 * 
 * Rule-based relevance scoring system for Admeasy feed
 * Replaces simple "latest-first" with relevance-based ranking
 * 
 * Scoring Factors (in priority order):
 * 1. Exam Relevance (Primary Signal)
 * 2. Following Graph
 * 3. Keyword Affinity
 * 4. Academic Context Matching
 * 5. Recency (small weight)
 */

const Post = require('../models/postSchema');
const Mentor = require('../models/mentorSchema');
const PostView = require('../models/postViewSchema');
const UserKeywordAffinity = require('../models/userKeywordAffinitySchema');

/**
 * Extract keywords from post content
 * Looks for exam names, college names, academic terms
 * @param {String} content - Post content
 * @returns {Array<String>} - Extracted keywords
 */
function extractKeywords(content) {
  if (!content) return [];

  // Common exam keywords (case-insensitive matching)
  const examKeywords = [
    'JEE', 'NEET', 'CUET', 'CAT', 'GMAT', 'GRE', 'UPSC', 'SSC', 'GATE',
    'CLAT', 'AILET', 'NATA', 'NID', 'NIFT', 'CA', 'CS', 'CMA',
    'JEE Main', 'JEE Advanced', 'NEET UG', 'NEET PG', 'CUET UG', 'CUET PG'
  ];

  // College/University keywords
  const collegeKeywords = [
    'SRCC', 'DU', 'Delhi University', 'IIT', 'IIM', 'NIT', 'BITS',
    'AIIMS', 'JNU', 'JMI', 'AMU', 'BHU', 'HCU'
  ];

  // Class/Board keywords
  const academicKeywords = [
    'Class 9', 'Class 10', 'Class 11', 'Class 12', '9th', '10th', '11th', '12th',
    'CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'
  ];

  const allKeywords = [...examKeywords, ...collegeKeywords, ...academicKeywords];
  const foundKeywords = [];

  const contentUpper = content.toUpperCase();

  allKeywords.forEach(keyword => {
    if (contentUpper.includes(keyword.toUpperCase())) {
      foundKeywords.push(keyword);
    }
  });

  // Also extract any capitalized words (potential college/exam names)
  const capitalizedWords = content.match(/\b[A-Z][A-Z]{2,}\b/g) || [];
  foundKeywords.push(...capitalizedWords.map(w => w.trim()));

  // Remove duplicates and return
  return [...new Set(foundKeywords.map(k => k.toLowerCase().trim()))];
}

/**
 * Calculate exam relevance score
 * @param {Object} post - Post object
 * @param {Object} user - User object with examsPreparingFor
 * @param {Object} mentor - Mentor object (if post is from mentor)
 * @returns {Number} - Exam relevance score (0-100)
 */
function calculateExamRelevanceScore(post, user, mentor) {
  let score = 0;

  if (!user || !user.examsPreparingFor || user.examsPreparingFor.length === 0) {
    return 0; // No exam preference = no exam relevance
  }

  const postKeywords = extractKeywords(post.content || '');
  const userExams = user.examsPreparingFor.map(e => e.toLowerCase().trim());

  // Check if post content contains user's exam keywords
  postKeywords.forEach(keyword => {
    userExams.forEach(userExam => {
      if (keyword.includes(userExam) || userExam.includes(keyword)) {
        score += 50; // Strong match
      }
    });
  });

  // Check if mentor's cleared exams match user's preparing exams
  if (mentor && mentor.competitiveExamsCleared && Array.isArray(mentor.competitiveExamsCleared)) {
    mentor.competitiveExamsCleared.forEach(clearedExam => {
      const examName = (clearedExam.name || clearedExam).toLowerCase().trim();
      userExams.forEach(userExam => {
        if (examName.includes(userExam) || userExam.includes(examName)) {
          score += 40; // Mentor expertise match
        }
      });
    });
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Calculate following boost score
 * @param {Object} post - Post object
 * @param {Object} user - User object with following array
 * @returns {Number} - Following boost score (0 or 30)
 */
function calculateFollowingBoost(post, user) {
  if (!user || !user.following || user.following.length === 0) {
    return 0;
  }

  const authorId = post.mentorId || post.userId;
  if (!authorId) return 0;

  const authorIdStr = authorId.toString();
  const isFollowing = user.following.some(
    id => id.toString() === authorIdStr
  );

  return isFollowing ? 30 : 0; // Fixed boost for following
}

/**
 * Calculate keyword affinity score
 * @param {Object} post - Post object
 * @param {String} userId - User ID
 * @returns {Promise<Number>} - Keyword affinity score (0-50)
 */
async function calculateKeywordAffinityScore(post, userId) {
  if (!userId) return 0;

  const postKeywords = extractKeywords(post.content || '');
  if (postKeywords.length === 0) return 0;

  try {
    // Get user's keyword affinities
    const affinities = await UserKeywordAffinity.find({
      userId,
      keyword: { $in: postKeywords }
    }).lean();

    if (affinities.length === 0) return 0;

    // Sum up weights (higher weight = stronger affinity)
    const totalWeight = affinities.reduce((sum, aff) => sum + (aff.weight || 1), 0);
    
    // Normalize to 0-50 range (assuming max weight per keyword is around 10)
    return Math.min(totalWeight * 5, 50);
  } catch (error) {
    console.error('Error calculating keyword affinity:', error);
    return 0;
  }
}

/**
 * Calculate academic context match score
 * @param {Object} post - Post object
 * @param {Object} user - User object with class, board, etc.
 * @returns {Number} - Academic context score (0-20)
 */
function calculateAcademicContextScore(post, user) {
  if (!user) return 0;

  let score = 0;
  const postContent = (post.content || '').toLowerCase();
  const postKeywords = extractKeywords(post.content || '');

  // Check class match
  if (user.class) {
    const classKeywords = [
      `class ${user.class.toLowerCase()}`,
      user.class.toLowerCase(),
      user.class.replace(/\D/g, '') + 'th'
    ];
    
    classKeywords.forEach(classKw => {
      if (postContent.includes(classKw) || postKeywords.some(k => k.includes(classKw))) {
        score += 10;
      }
    });
  }

  // Check board match
  if (user.board) {
    const boardLower = user.board.toLowerCase();
    if (postContent.includes(boardLower) || postKeywords.some(k => k.includes(boardLower))) {
      score += 10;
    }
  }

  return Math.min(score, 20); // Cap at 20
}

/**
 * Calculate recency score (small weight to keep feed fresh)
 * @param {Date} createdAt - Post creation date
 * @returns {Number} - Recency score (0-10)
 */
function calculateRecencyScore(createdAt) {
  if (!createdAt) return 0;

  const now = new Date();
  const ageInHours = (now - new Date(createdAt)) / (1000 * 60 * 60);

  // Posts less than 24 hours old get full score
  if (ageInHours < 24) return 10;
  // Posts 1-7 days old get decreasing score
  if (ageInHours < 168) return 10 - (ageInHours / 24) * 2;
  // Older posts get minimal score
  return Math.max(1, 10 - (ageInHours / 24) * 0.5);
}

/**
 * Calculate total relevance score for a post
 * @param {Object} post - Post object
 * @param {Object} user - User object
 * @param {Object} mentor - Mentor object (if post is from mentor)
 * @returns {Promise<Number>} - Total relevance score
 */
async function calculatePostRelevanceScore(post, user, mentor) {
  let totalScore = 0;

  // 1. Exam Relevance (Primary Signal) - Weight: 100
  const examScore = calculateExamRelevanceScore(post, user, mentor);
  totalScore += examScore;

  // 2. Following Boost - Weight: 30
  const followingScore = calculateFollowingBoost(post, user);
  totalScore += followingScore;

  // 3. Keyword Affinity - Weight: 50
  const keywordScore = await calculateKeywordAffinityScore(post, user?._id);
  totalScore += keywordScore;

  // 4. Academic Context - Weight: 20
  const academicScore = calculateAcademicContextScore(post, user);
  totalScore += academicScore;

  // 5. Recency - Weight: 10 (small, not dominant)
  const recencyScore = calculateRecencyScore(post.createdAt);
  totalScore += recencyScore;

  return totalScore;
}

/**
 * Get user's following list (both users and mentors)
 * @param {Object} user - User object
 * @returns {Array<String>} - Array of followed IDs as strings
 */
function getUserFollowingIds(user) {
  if (!user || !user.following) return [];
  return user.following.map(id => id.toString());
}

/**
 * Rank and fetch feed posts
 * @param {Object} user - Current user (optional, for personalized feed)
 * @param {Number} page - Page number
 * @param {Number} limit - Posts per page
 * @returns {Promise<Object>} - Ranked posts with pagination
 */
async function getRankedFeed(user = null, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;

    // Step 1: Get post view states for current user
    let unseenPostIds = [];
    let seenPostIds = [];
    let engagedPostIds = [];

    if (user) {
      const postViews = await PostView.find({ userId: user._id }).lean();
      
      postViews.forEach(view => {
        const postIdStr = view.postId.toString();
        if (view.state === 'UNSEEN') {
          unseenPostIds.push(postIdStr);
        } else if (view.state === 'SEEN') {
          seenPostIds.push(postIdStr);
        } else if (view.state === 'ENGAGED') {
          engagedPostIds.push(postIdStr);
        }
      });
    }

    // Step 2: Fetch posts prioritizing UNSEEN, then SEEN, then ENGAGED
    let posts = [];
    const targetCount = limit * 3; // Fetch more to rank, then take top N

    // Collect all post IDs that user has interacted with (for exclusion)
    const allViewedPostIds = user 
      ? [...unseenPostIds, ...seenPostIds, ...engagedPostIds]
      : [];

    // First, try to get UNSEEN posts (posts user has never seen)
    if (user && unseenPostIds.length > 0) {
      const unseenPosts = await Post.find({
        _id: { $in: unseenPostIds }
      })
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .lean()
        .limit(targetCount);
      posts.push(...unseenPosts);
    }

    // If no unseen posts or need more, get posts that haven't been viewed at all
    if (posts.length < targetCount && user) {
      const unviewedPosts = await Post.find({
        _id: { $nin: allViewedPostIds }
      })
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .sort({ createdAt: -1 })
        .lean()
        .limit(targetCount - posts.length);
      posts.push(...unviewedPosts);
    }

    // If still not enough, get SEEN but not ENGAGED posts
    if (posts.length < targetCount && user && seenPostIds.length > 0) {
      const seenPosts = await Post.find({
        _id: { $in: seenPostIds }
      })
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .lean()
        .limit(targetCount - posts.length);
      posts.push(...seenPosts);
    }

    // Last resort: get ENGAGED posts (heavily deprioritized)
    if (posts.length < targetCount && user && engagedPostIds.length > 0) {
      const engagedPosts = await Post.find({
        _id: { $in: engagedPostIds }
      })
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .lean()
        .limit(Math.min(limit / 2, targetCount - posts.length)); // Only half of limit
      posts.push(...engagedPosts);
    }

    // For non-authenticated users or if still need more posts, fetch recent posts
    if (posts.length < targetCount) {
      const query = user && allViewedPostIds.length > 0 
        ? { _id: { $nin: allViewedPostIds } }
        : {};
      
      const morePosts = await Post.find(query)
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .sort({ createdAt: -1 })
        .lean()
        .limit(targetCount - posts.length);
      posts.push(...morePosts);
    }

    // Step 3: Calculate relevance scores for all posts
    const postsWithScores = await Promise.all(
      posts.map(async (post) => {
        const mentor = post.mentorId || null;
        const score = await calculatePostRelevanceScore(post, user, mentor);
        return { post, score };
      })
    );

    // Step 4: Sort by score (descending), then by recency
    postsWithScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // Higher score first
      }
      // Tie-breaker: newer posts first
      return new Date(b.post.createdAt) - new Date(a.post.createdAt);
    });

    // Step 5: Extract posts and apply pagination
    const rankedPosts = postsWithScores
      .slice(skip, skip + limit)
      .map(item => item.post);

    // Step 6: Get total count for pagination
    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: rankedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        pages: totalPages,
      },
      hasMore: skip + limit < postsWithScores.length,
    };
  } catch (error) {
    console.error('Error in getRankedFeed:', error);
    throw error;
  }
}

module.exports = {
  extractKeywords,
  calculatePostRelevanceScore,
  getRankedFeed,
  calculateExamRelevanceScore,
  calculateFollowingBoost,
  calculateKeywordAffinityScore,
  calculateAcademicContextScore,
  calculateRecencyScore,
};
