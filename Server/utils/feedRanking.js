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
 * Get the author id for a post, whether mentor or student
 * @param {Object} post
 * @returns {String|null}
 */
function getPostAuthorId(post) {
  if (!post) return null;
  if (post.mentorId) return post.mentorId.toString();
  if (post.userId) return post.userId.toString();
  return null;
}

/**
 * Calculate a normalized engagement signal for trending weight
 * @param {Object} post
 * @returns {Number}
 */
function calculateEngagementSignal(post) {
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const reposts = post.repostCount || 0;
  return likes + comments * 2 + reposts * 3;
}

/**
 * Score a post for trending relevance.
 * Trending posts should be recent but also engagement-worthy.
 * @param {Object} post
 * @returns {Number}
 */
function calculateTrendingScore(post) {
  const engagement = calculateEngagementSignal(post);
  if (engagement === 0) return 0;

  const ageInHours = (new Date() - new Date(post.createdAt)) / (1000 * 60 * 60);
  const recencyFactor = ageInHours < 168 ? Math.max(0.35, 1 - ageInHours / 168) : 0.35;
  return Math.min(35, engagement * recencyFactor);
}

/**
 * Boost score for posts that match student or mentor role priorities.
 * @param {Object} post
 * @param {Object} user
 * @returns {Number}
 */
function calculateRoleRelevanceScore(post, user) {
  const content = (post.content || '').toLowerCase();
  const hashtags = (post.hashtags || []).map(tag => tag.toLowerCase());
  const isMentorPost = !!post.mentorId;
  const isStudentPost = !!post.userId;
  let score = 0;

  const collegeTerms = /college|admission|application|cutoff|rank|career|campus|hostel|university|branch|course|entrance/;
  const studyTerms = /notes|study|revision|syllabus|exam|question|doubt|strategy|preparation|tips|formula|practice|mcq/;
  const doubtTerms = /doubt|question|help|stuck|issue|problem|clarify|confused/;

  if (user?.role === 'mentor') {
    if (isStudentPost) score += 30;
    if (doubtTerms.test(content) || hashtags.some(tag => ['doubt', 'question', 'help'].includes(tag))) {
      score += 30;
    }
    if (studyTerms.test(content) || hashtags.some(tag => ['study', 'notes', 'exam', 'revision'].includes(tag))) {
      score += 20;
    }
    if (collegeTerms.test(content) || hashtags.some(tag => ['college', 'admission', 'application', 'cutoff'].includes(tag))) {
      score += 15;
    }
  } else {
    if (isMentorPost) score += 25;
    if (collegeTerms.test(content) || hashtags.some(tag => ['college', 'admission', 'application', 'cutoff', 'rank'].includes(tag))) {
      score += 30;
    }
    if (studyTerms.test(content) || hashtags.some(tag => ['study', 'notes', 'exam', 'revision', 'mcq'].includes(tag))) {
      score += 25;
    }
    if (doubtTerms.test(content) || hashtags.some(tag => ['doubt', 'question', 'help'].includes(tag))) {
      score += 15;
    }
    if (post.type === 'poll' || post.type === 'mcq') {
      score += 10;
    }
  }

  if (hashtags.includes('masti') && user?.role !== 'mentor') {
    score -= 10;
  }

  return Math.max(0, Math.min(score, 70));
}

/**
 * Boost for post view state to avoid repeats and surface unseen content.
 * @param {Object} post
 * @param {Map<String, String>} viewStateMap
 * @returns {Number}
 */
function calculateViewStateBoost(post, viewStateMap) {
  if (!viewStateMap || !post || !post._id) return 0;
  const state = viewStateMap.get(post._id.toString());
  if (state === 'UNSEEN') return 35;
  if (state === 'SEEN') return 10;
  if (state === 'ENGAGED') return -20;
  return 0;
}

/**
 * Calculate total relevance score for a post
 * @param {Object} post - Post object
 * @param {Object} user - User object
 * @param {Object} mentor - Mentor object (if post is from mentor)
 * @param {Map<String, String>} viewStateMap - view states for user posts
 * @returns {Promise<Number>} - Total relevance score
 */
async function calculatePostRelevanceScore(post, user, mentor, viewStateMap) {
  let totalScore = 0;

  const examScore = calculateExamRelevanceScore(post, user, mentor);
  totalScore += examScore;

  const followScore = calculateFollowingBoost(post, user);
  totalScore += followScore;

  const keywordScore = await calculateKeywordAffinityScore(post, user?._id);
  totalScore += keywordScore;

  const academicScore = calculateAcademicContextScore(post, user);
  totalScore += academicScore;

  const recencyScore = calculateRecencyScore(post.createdAt);
  totalScore += recencyScore;

  const trendingScore = calculateTrendingScore(post);
  totalScore += trendingScore;

  const roleScore = calculateRoleRelevanceScore(post, user);
  totalScore += roleScore;

  const viewStateBoost = calculateViewStateBoost(post, viewStateMap);
  totalScore += viewStateBoost;

  totalScore += Math.random() * 5;

  return Math.min(Math.max(totalScore, 0), 220);
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
 * Reorder posts so the same author does not appear twice in a row when possible.
 * @param {Array<Object>} posts
 * @returns {Array<Object>}
 */
function interleavePostsByAuthor(posts) {
  const buckets = new Map();
  posts.forEach(post => {
    const authorId = getPostAuthorId(post) || '__unknown';
    if (!buckets.has(authorId)) buckets.set(authorId, []);
    buckets.get(authorId).push(post);
  });

  const orderedAuthors = Array.from(buckets.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([author]) => author);

  const result = [];
  while (result.length < posts.length) {
    let added = false;
    const lastAuthor = result.length ? getPostAuthorId(result[result.length - 1]) : null;

    for (const authorId of orderedAuthors) {
      const bucket = buckets.get(authorId);
      if (!bucket || bucket.length === 0) continue;
      if (authorId === lastAuthor && orderedAuthors.some(id => id !== authorId && buckets.get(id)?.length > 0)) {
        continue;
      }
      result.push(bucket.shift());
      added = true;
    }

    if (!added) {
      for (const authorId of orderedAuthors) {
        const bucket = buckets.get(authorId);
        if (bucket && bucket.length > 0) {
          result.push(bucket.shift());
          added = true;
          break;
        }
      }
    }

    if (!added) break;
  }

  return result;
}

/**
 * Rank and fetch feed posts
 * @param {Object} user - Current user (optional, for personalized feed)
 * @param {Number} page - Page number
 * @param {Number} limit - Posts per page
 * @returns {Promise<Object>} - Ranked posts with pagination
 */
async function getRankedFeed(user = null, page = 1, limit = 20, category = 'study') {
  try {
    const skip = (page - 1) * limit;
    const categoryFilter = category === 'study'
      ? { $or: [{ category: 'study' }, { category: { $exists: false } }, { category: null }] }
      : { category: 'masti' };

    let unseenPostIds = [];
    let seenPostIds = [];
    let engagedPostIds = [];
    const viewStateMap = new Map();

    if (user) {
      const postViews = await PostView.find({ userId: user._id }).lean();
      postViews.forEach(view => {
        const postIdStr = view.postId.toString();
        viewStateMap.set(postIdStr, view.state);
        if (view.state === 'UNSEEN') {
          unseenPostIds.push(postIdStr);
        } else if (view.state === 'SEEN') {
          seenPostIds.push(postIdStr);
        } else if (view.state === 'ENGAGED') {
          engagedPostIds.push(postIdStr);
        }
      });
    }

    const allViewedPostIds = user ? [...unseenPostIds, ...seenPostIds, ...engagedPostIds] : [];
    const followingIds = getUserFollowingIds(user);
    const followerQuery = followingIds.length > 0 ? { $or: [{ mentorId: { $in: followingIds } }, { userId: { $in: followingIds } }] } : null;

    const targetCount = Math.min(220, Math.max(limit * 4, limit * (page + 2)));
    const discoveryLimit = Math.min(50, targetCount);
    const recentWindow = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21);

    const candidateQueries = [];
    if (followerQuery) {
      candidateQueries.push(
        Post.find({ ...categoryFilter, ...followerQuery })
          .populate('mentorId', 'name username image competitiveExamsCleared')
          .sort({ createdAt: -1 })
          .lean()
          .limit(targetCount)
      );
    }

    candidateQueries.push(
      Post.find({ ...categoryFilter, createdAt: { $gte: recentWindow } })
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .sort({ likesCount: -1, commentsCount: -1, repostCount: -1, createdAt: -1 })
        .lean()
        .limit(targetCount)
    );

    candidateQueries.push(
      Post.find({ ...categoryFilter })
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .sort({ createdAt: -1 })
        .lean()
        .limit(targetCount)
    );

    candidateQueries.push(
      Post.find({
        ...categoryFilter,
        ...(allViewedPostIds.length ? { _id: { $nin: allViewedPostIds } } : {}),
      })
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .sort({ createdAt: -1 })
        .lean()
        .limit(discoveryLimit)
    );

    const candidateResults = await Promise.all(candidateQueries);
    let followedPosts = [];
    let trendingPosts = [];
    let recentPosts = [];
    let discoveryPosts = [];

    if (candidateResults.length === 4) {
      [followedPosts, trendingPosts, recentPosts, discoveryPosts] = candidateResults;
    } else if (candidateResults.length === 3) {
      [trendingPosts, recentPosts, discoveryPosts] = candidateResults;
    }

    const sourcePosts = [
      ...followedPosts,
      ...trendingPosts,
      ...recentPosts,
      ...discoveryPosts,
    ];

    const uniquePostsMap = new Map();
    sourcePosts.forEach(post => {
      if (post && post._id) {
        uniquePostsMap.set(post._id.toString(), post);
      }
    });

    if (uniquePostsMap.size < Math.max(skip + limit, limit * 2)) {
      const fallbackQuery = {
        ...categoryFilter,
        _id: { $nin: [...Array.from(uniquePostsMap.keys()).map(id => id), ...allViewedPostIds] },
      };
      const fallbackPosts = await Post.find(fallbackQuery)
        .populate('mentorId', 'name username image competitiveExamsCleared')
        .sort({ createdAt: -1 })
        .lean()
        .limit(Math.max(limit * 2, skip + limit) - uniquePostsMap.size);
      fallbackPosts.forEach(post => {
        if (post && post._id && !uniquePostsMap.has(post._id.toString())) {
          uniquePostsMap.set(post._id.toString(), post);
        }
      });
    }

    const allCandidatePosts = Array.from(uniquePostsMap.values());

    const postsWithScores = await Promise.all(
      allCandidatePosts.map(async (post) => {
        const mentor = post.mentorId || null;
        const score = await calculatePostRelevanceScore(post, user, mentor, viewStateMap);
        return { post, score };
      })
    );

    postsWithScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.createdAt) - new Date(a.post.createdAt);
    });

    const orderedPosts = interleavePostsByAuthor(postsWithScores.map(item => item.post));
    const pagedPosts = orderedPosts.slice(skip, skip + limit);

    const totalPosts = await Post.countDocuments(categoryFilter);
    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: pagedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        pages: totalPages,
      },
      hasMore: skip + limit < orderedPosts.length,
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
