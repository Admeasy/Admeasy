const express = require("express");
const router = express.Router();
const Post = require("../models/postSchema");
const Mentor = require("../models/mentorSchema");
const User = require("../models/userSchema");
const Space = require("../models/spaceSchema");
const { Users } = require("../db");
const redis = require('../config/redis');
const apiCache = require('../middleware/apiCache');
const authenticateMentorJWT = require("../middleware/mentorAuth");
const authenticateJWT = require("../middleware/userAuth");
const { authenticateRequired } = require("../middleware/combinedAuth");
const upload = require("../middleware/multer");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const { detectUrl, generateLinkPreview } = require("../utils/linkPreview");
const path = require("path");
const jwt = require("jsonwebtoken");
const { verifyAdminToken } = require("../middleware/adminAuth");
const NotificationService = require("../services/notificationService");
const NotificationManager = require("../services/notificationManager");
const { getRankedFeed } = require("../utils/feedRanking");
const feedController = require("../controllers/feedController");
const { extractPublicId } = require("../utils/cloudinary");
// const { trackStudentEvent } = require("../services/interactionTrackingService");
const { hasVisiblePostText } = require("../utils/postContent");

const getPublicIdFromUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  try {
    return extractPublicId(imageUrl);
  } catch (error) {
    return null;
  }
};

function safeJsonParse(value, source = 'cache') {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(`JSON parse error (${source}):`, error);
    return null;
  }
}

async function safeRedisGet(key) {
  if (!redis || redis.status !== 'ready') {
    console.warn(`Redis not ready for GET ${key}: status=${redis?.status}`);
    return null;
  }

  try {
    return await redis.get(key);
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

async function safeRedisSet(key, value, ttlSeconds = 90) {
  if (!redis || redis.status !== 'ready') {
    console.warn(`Redis not ready for SET ${key}: status=${redis?.status}`);
    return false;
  }

  try {
    await redis.set(key, value, 'EX', ttlSeconds);
    return true;
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
}

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

// Helper function to extract mentions from post content
// Extracts @username patterns from HTML content
function extractMentions(content) {
  if (!content || typeof content !== 'string') return [];

  // Remove HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, ' ');

  // Match @username patterns (alphanumeric and underscore)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = plainText.match(mentionRegex);

  if (!matches) return [];

  // Extract unique usernames (remove @ symbol)
  const usernames = [...new Set(matches.map(match => match.substring(1)))];
  return usernames;
}

// Helper function to create mention notifications
async function createMentionNotifications(postContent, postId, actorId, actorRole, actorName) {
  try {
    const mentionedUsernames = extractMentions(postContent);
    if (mentionedUsernames.length === 0) return;

    // Find all mentioned users and mentors
    const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } })
      .select('_id username name')
      .lean();
    const mentionedMentors = await Mentor.find({ username: { $in: mentionedUsernames } })
      .select('_id username name')
      .lean();

    // Combine and create notifications
    const allMentioned = [
      ...mentionedUsers.map(u => ({ ...u, role: 'user' })),
      ...mentionedMentors.map(m => ({ ...m, role: 'mentor' }))
    ];

    // Create notifications for each mentioned user/mentor
    for (const mentioned of allMentioned) {
      // Skip if mentioned user is the actor (self-mention)
      if (mentioned._id.toString() === actorId.toString()) continue;

      await NotificationManager.createAndSend({
        recipientId: mentioned._id,
        recipientRole: mentioned.role,
        actorId: actorId,
        type: 'MENTION',
        entityType: 'POST',
        entityId: postId,
        originPath: `/posts/${postId}`,
        message: `${actorName} mentioned you in a post`,
        actorInfo: { name: actorName },
      });
    }
  } catch (error) {
    console.error('Error creating mention notifications:', error);
    // Don't throw - mention notifications are not critical
  }
}

// Helper function to format poll data with totals and user status
function formatPollData(post, currentUserId) {
  if (!post.poll || post.type !== "poll") return null;

  const totalVotes = post.poll.options?.reduce((sum, opt) => sum + (opt.votedBy?.length || 0), 0) || 0;
  let hasVoted = false;
  let userVotedOption = null;

  const options = post.poll.options?.map(opt => {
    const isThisOptionVoted = currentUserId && opt.votedBy?.some(id => id.toString() === currentUserId.toString());
    if (isThisOptionVoted) {
      hasVoted = true;
      userVotedOption = opt._id;
    }

    return {
      _id: opt._id,
      text: opt.text,
      votes: opt.votedBy?.length || 0,
      percentage: totalVotes > 0 ? Math.round(((opt.votedBy?.length || 0) / totalVotes) * 100) : 0
    };
  }) || [];

  return {
    question: post.poll.question,
    options,
    totalVotes,
    hasVoted,
    userVotedOption
  };
}

// Helper function to format MCQ data with results and user status
function formatMcqData(post, currentUserId) {
  if (!post.mcq || post.type !== "mcq") return null;

  const totalAnswers = post.mcq.options?.reduce((sum, opt) => sum + (opt.chosenBy?.length || 0), 0) || 0;
  let hasAnswered = false;
  let userSelectedOptionId = null;

  const options = post.mcq.options?.map(opt => {
    const isThisOptionChosen = currentUserId && opt.chosenBy?.some(id => id.toString() === currentUserId.toString());
    if (isThisOptionChosen) {
      hasAnswered = true;
      userSelectedOptionId = opt._id;
    }

    return {
      _id: opt._id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      votes: opt.chosenBy?.length || 0,
      percentage: totalAnswers > 0 ? Math.round(((opt.chosenBy?.length || 0) / totalAnswers) * 100) : 0
    };
  }) || [];

  return {
    question: post.mcq.question,
    options,
    totalAnswers,
    hasAnswered,
    userSelectedOptionId
  };
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

// Get full user context for feed ranking (includes exam and academic context)
async function getUserForRanking(req) {
  const token = req.cookies?.accessToken;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const Mentor = require('../models/mentorSchema');

    // Only users have exam/academic context, mentors don't need ranking
    if (decoded.role === 'mentor') {
      const mentor = await Mentor.findById(decoded.id || decoded._id)
        .select('following reposts _id competitiveExamsCleared')
        .lean();
      return mentor ? { ...mentor, role: 'mentor' } : null;
    } else {
      const user = await User.findById(decoded.id || decoded._id)
        .select('following reposts _id examsPreparingFor class board educationType stream')
        .lean();
      return user ? { ...user, role: 'user' } : null;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Token validation failed (user for ranking):', err.message);
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
          type: post.type || 'post',
          content: post.content,
          image: post.image,
          images: post.images || [],
          hashtags: post.hashtags || [],
          poll: formatPollData(post, null),
          mcq: formatMcqData(post, null),
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          isEdited: post.isEdited || false,
          editedAt: post.editedAt || null,
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
 * Uses relevance-based ranking algorithm (V1)
 * 
 * Feed Ranking Logic:
 * 1. Prioritizes UNSEEN posts first
 * 2. Then SEEN but not ENGAGED posts
 * 3. ENGAGED posts are heavily deprioritized
 * 4. Posts are scored by: Exam relevance, Following, Keyword affinity, Academic context, Recency
 * 
 * Note: Pagination does NOT mark posts as seen. Only explicit view tracking does.
 */
router.get("/", async (req, res) => {
  try {
    // Get full user context for ranking (includes exam/academic data)
    const currentUser = await getUserForRanking(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // NEW: Extract hashtag and feed type (study/masti) from query
    const hashtag = req.query.hashtag;
    const category = ['study', 'masti'].includes(req.query.type) ? req.query.type : 'study';

    // Build category filter (backward safe: old posts with no category → treated as 'study')
    const categoryFilter = category === 'study'
      ? { $or: [{ category: 'study' }, { category: { $exists: false } }, { category: null }] }
      : { category: 'masti' };

    // Use ranking algorithm to get personalized feed
    let feedResult;

    // NEW: If a hashtag is searched, bypass ranking and filter directly
    if (hashtag) {
      const skip = (page - 1) * limit;
      // Case-insensitive regex match for the hashtag — also respect category
      const filter = { hashtags: new RegExp(`^${hashtag}$`, 'i'), ...categoryFilter };

      const filteredPosts = await Post.find(filter)
        .populate('mentorId', 'name username image')
        .populate({ path: 'spaceId', model: Space, select: 'name logo' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments(filter);

      feedResult = {
        posts: filteredPosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } else {
      // Normal behavior: Use ranking algorithm with category filter
      try {
        feedResult = await getRankedFeed(currentUser, page, limit, category);
      } catch (rankingError) {
        console.error('Error in feed ranking algorithm, falling back to simple sort:', rankingError);
        const skip = (page - 1) * limit;
        const fallbackPosts = await Post.find(categoryFilter)
          .populate('mentorId', 'name username image')
          .populate({ path: 'spaceId', model: Space, select: 'name logo' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        const total = await Post.countDocuments(categoryFilter);
        feedResult = {
          posts: fallbackPosts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      }
    }

    const posts = feedResult.posts;

    // OPTIMIZED: Batch all user lookups to avoid N+1 queries
    // Collect all unique user IDs from:
    // 1. Post authors (userId field)
    // 2. Post likes
    // 3. Comment authors (for comment previews)
    const allUserIds = new Set();
    const allCommentAuthorIds = new Set();
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
      // Collect comment author IDs (can be users or mentors)
      (post.comments || []).forEach(comment => {
        if (comment.userId && !comment.deleted) {
          allCommentAuthorIds.add(comment.userId.toString());
        }
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

    // Batch fetch all comment authors (both users and mentors)
    const commentAuthorIdsArray = Array.from(allCommentAuthorIds);
    const commentAuthorsMap = new Map();
    if (commentAuthorIdsArray.length > 0) {
      // Fetch users
      const commentUsers = await User.find({ _id: { $in: commentAuthorIdsArray } })
        .select('name image _id username')
        .lean();
      commentUsers.forEach(user => {
        commentAuthorsMap.set(user._id.toString(), {
          _id: user._id,
          name: user.name,
          image: user.image,
          username: user.username || null,
          isMentor: false,
        });
      });

      // Fetch mentors (check which IDs are mentors)
      const commentMentors = await Mentor.find({ _id: { $in: commentAuthorIdsArray } })
        .select('name image _id username')
        .lean();
      commentMentors.forEach(mentor => {
        commentAuthorsMap.set(mentor._id.toString(), {
          _id: mentor._id,
          name: mentor.name,
          image: mentor.image,
          username: mentor.username || null,
          isMentor: true,
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

      // Find best comment preview: prioritize mentor comments, then user comments
      let commentPreview = null;
      const allComments = (post.comments || []).filter(c => !c.deleted);
      if (allComments.length > 0) {
        // Separate mentor and user comments
        const mentorComments = [];
        const userComments = [];

        allComments.forEach(comment => {
          // Skip comments that engage in "self-replying" with identical content
          // This prevents the "double vision" effect where post content appears as a comment
          const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();
          if (stripHtml(comment.content) === stripHtml(post.content)) {
            return;
          }

          if (comment.userId) {
            // Handle both ObjectId (from .lean()) and populated objects
            const commentUserId = comment.userId._id
              ? comment.userId._id.toString()
              : comment.userId.toString();
            const commentAuthor = commentAuthorsMap.get(commentUserId);

            if (commentAuthor && commentAuthor.isMentor) {
              mentorComments.push(comment);
            } else if (commentAuthor) {
              userComments.push(comment);
            }
          }
        });

        // Sort by createdAt (latest first)
        mentorComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        userComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Prioritize mentor comments
        const selectedComment = mentorComments.length > 0 ? mentorComments[0] : (userComments.length > 0 ? userComments[0] : null);

        if (selectedComment && selectedComment.userId) {
          // Handle both ObjectId (from .lean()) and populated objects
          const commentUserId = selectedComment.userId._id
            ? selectedComment.userId._id.toString()
            : selectedComment.userId.toString();
          const commentAuthor = commentAuthorsMap.get(commentUserId);
          if (commentAuthor) {
            commentPreview = {
              _id: selectedComment._id,
              content: selectedComment.content,
              author: {
                _id: commentAuthor._id,
                name: commentAuthor.name,
                username: commentAuthor.username,
                image: commentAuthor.image,
              },
              isMentor: commentAuthor.isMentor || false,
              createdAt: selectedComment.createdAt,
            };
          }
        }
      }

      return {
        _id: post._id,
        type: post.type || 'post',
        mentor: author, // Keep 'mentor' key for backward compatibility
        author: author, // Add 'author' key for clarity
        headline: post.headline || null,
        content: post.content,
        category: post.category || 'study',
        space: post.spaceId ? { _id: post.spaceId._id, name: post.spaceId.name, logo: post.spaceId.logo } : null,
        image: post.image,
        images: post.images || [],
        hashtags: post.hashtags || [],
        poll: formatPollData(post, currentUser?._id),
        mcq: formatMcqData(post, currentUser?._id),
        hasVoted: post.type === 'poll' && post.poll?.options?.some(opt => opt.votedBy?.some(id => id.toString() === currentUser?._id?.toString())),
        userVotedOption: post.type === 'poll' ? post.poll?.options?.find(opt => opt.votedBy?.some(id => id.toString() === currentUser?._id?.toString()))?._id : null,
        externalLink: post.externalLink,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        repostCount: post.repostCount || 0,
        isLiked,
        isFollowing,
        isReposted,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isEdited: post.isEdited || false,
        editedAt: post.editedAt || null,
        commentPreview, // Add comment preview
      };
    });

    // Use pagination from ranking algorithm
    res.json({
      success: true,
      posts: formattedPosts,
      pagination: feedResult.pagination,
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
        type: post.type || 'post',
        mentor: author,
        author: author,
        headline: post.headline || null,
        content: post.content,
        category: post.category || 'study',
        space: post.spaceId ? { _id: post.spaceId._id, name: post.spaceId.name, logo: post.spaceId.logo } : null,
        image: post.image,
        images: post.images || [],
        hashtags: post.hashtags || [],
        poll: formatPollData(post, currentUser?._id),
        mcq: formatMcqData(post, currentUser?._id),
        hasVoted: post.type === 'poll' && post.poll?.options?.some(opt => opt.votedBy?.some(id => id.toString() === currentUser?._id?.toString())),
        userVotedOption: post.type === 'poll' ? post.poll?.options?.find(opt => opt.votedBy?.some(id => id.toString() === currentUser?._id?.toString()))?._id : null,
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
        isEdited: post.isEdited || false,
        editedAt: post.editedAt || null,
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const cacheKey = `mentorPosts:${req.params.mentorId}:page:${page}`;

    let cachedResponse = null;
    const cachedValue = await safeRedisGet(cacheKey);
    if (cachedValue) {
      cachedResponse = safeJsonParse(cachedValue, cacheKey);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }
      console.warn(`Invalid cached JSON for key ${cacheKey}, falling back to MongoDB`);
    }

    const posts = await Post.find({ mentorId: req.params.mentorId })
      .populate('mentorId', 'name username image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

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

      let isFollowing = false;
      if (currentUser && currentUser.following && post.mentorId) {
        isFollowing = currentUser.following.some(id => id.toString() === post.mentorId._id.toString());
      }

      const isReposted = currentUser && currentUser.reposts
        ? currentUser.reposts.some(id => id.toString() === post._id.toString())
        : false;

      let isLiked = false;
      if (currentUser) {
        isLiked = (post.likes || []).some(like => {
          if (!like.userId) return false;
          const likeUserId = like.userId._id ? like.userId._id.toString() : like.userId.toString();
          return likeUserId === currentUser._id.toString();
        });
      }

      return {
        _id: post._id,
        type: post.type || 'post',
        mentor: author,
        author: author,
        headline: post.headline || null,
        content: post.content,
        category: post.category || 'study',
        space: post.spaceId ? { _id: post.spaceId._id, name: post.spaceId.name, logo: post.spaceId.logo } : null,
        image: post.image,
        images: post.images || [],
        hashtags: post.hashtags || [],
        poll: formatPollData(post, currentUser?._id),
        mcq: formatMcqData(post, currentUser?._id),
        hasVoted: post.type === 'poll' && post.poll?.options?.some(opt => opt.votedBy?.some(id => id.toString() === currentUser?._id?.toString())),
        userVotedOption: post.type === 'poll' ? post.poll?.options?.find(opt => opt.votedBy?.some(id => id.toString() === currentUser?._id?.toString()))?._id : null,
        externalLink: post.externalLink,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        repostCount: post.repostCount || 0,
        isLiked,
        isFollowing,
        isReposted,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isEdited: post.isEdited || false,
        editedAt: post.editedAt || null,
      };
    });

    const total = await Post.countDocuments({ mentorId: req.params.mentorId });
    const response = {
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    void safeRedisSet(cacheKey, JSON.stringify(response), 90);
    res.json({ response });
  } catch (error) {
    console.error("Error fetching mentor posts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/posts/:postId/view
 * Track post view (authenticated users only)
 * Marks post as SEEN when visibility conditions are met
 * 
 * IMPORTANT: This route must be defined BEFORE the generic /:postId route
 * to ensure proper route matching
 */
router.post("/:postId/view", authenticateRequired, feedController.trackPostView);

/**
 * GET /api/posts/:postId/view-state
 * Get post view state for current user
 * 
 * IMPORTANT: This route must be defined BEFORE the generic /:postId route
 * to ensure proper route matching
 */
router.get("/:postId/view-state", authenticateRequired, feedController.getPostViewState);

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
      type: post.type || 'post',
      mentor: author, // Keep 'mentor' key for backward compatibility
      author: author, // Add 'author' key for clarity
      headline: post.headline || null,
      content: post.content,
      category: post.category || 'study',
      space: post.spaceId ? { _id: post.spaceId._id, name: post.spaceId.name, logo: post.spaceId.logo } : null,
      image: post.image,
      images: post.images || [],
      hashtags: post.hashtags || [],
      poll: formatPollData(post, currentUser?._id),
      mcq: formatMcqData(post, currentUser?._id),
      hasVoted: post.type === 'poll' && post.poll?.options?.some(opt => opt.votedBy?.some(id => id.toString() === currentUser?._id?.toString())),
      userVotedOption: post.type === 'poll' ? post.poll?.options?.find(opt => opt.votedBy?.some(id => id.toString() === currentUser?._id?.toString()))?._id : null,
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
      isEdited: post.isEdited || false,
      editedAt: post.editedAt || null,
    };

    res.json({ success: true, post: formattedPost });
  } catch (error) {
    console.error("Error fetching mentor post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/posts
 * Create a new post (mentors and users, supports regular posts with multiple images and polls)
 */
/**
 * POST /api/posts
 * Create a new post (mentors and users, supports regular posts with multiple images and polls)
 */
router.post("/", authenticateRequired, upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 5 }]), async (req, res) => {
  try {
    const { type = "post", content, hashtags, headline, category, spaceId, question, options: rawOptions } = req.body;

    // ── POLL branch ──────────────────────────────────────────────────────
    if (type === "poll") {
      if (!question || !question.trim()) {
        return res.status(400).json({
          success: false,
          message: "Question is required for polls",
        });
      }

      // Parse options — frontend sends JSON string
      let options;
      try {
        options = typeof rawOptions === "string" ? JSON.parse(rawOptions) : rawOptions;
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid options format",
        });
      }

      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Polls must have at least 2 options",
        });
      }

      // Create poll post
      const postData = {
        type: "poll",
        headline: headline ? headline.trim() : null,
        content: question.trim(), // Satisfy required 'content' field
        poll: {
          question: question.trim(),
          options: options.map(opt => ({ text: opt.text || opt, votedBy: [] })),
        },
        category: ['study', 'masti'].includes(category) ? category : 'study',
        spaceId: spaceId || null,
        hashtags: hashtags ? JSON.parse(hashtags) : [],
      };

      if (req.mentor) {
        postData.mentorId = req.mentor._id;
      } else if (req.user) {
        postData.userId = req.user._id;
      }

      const post = new Post(postData);
      await post.save();

      // Populate author
      if (post.mentorId) {
        await post.populate('mentorId', 'name username image');
      } else if (post.userId) {
        const user = await populateUser(post.userId);
        post.userId = user;
      }

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

      // Notification logic for poll
      (async () => {
        try {
          const authorDoc = req.mentor || req.user;
          const authorId = authorDoc._id;
          const authorName = author?.name || authorDoc.name || "Someone";
          const followers = authorDoc.followers || [];
          if (followers.length > 0) {
            await NotificationManager.createAndSendMultiple({
              recipientIds: followers,
              recipientRole: "user",
              actorId: authorId,
              type: "FOLLOWING_POST",
              entityType: "POST",
              entityId: post._id,
              originPath: `/posts/${post._id}`,
              message: `${authorName} posted a poll`,
              actorInfo: { name: authorName, username: author?.username },
            });
          }
        } catch (err) {
          console.error("Error sending poll notification:", err);
        }
      })();

      return res.status(201).json({
        success: true,
        message: "Poll created successfully",
        post: {
          _id: post._id,
          mentor: author,
          author: author,
          type: "poll",
          headline: post.headline,
          poll: post.poll,
          category: post.category || 'study',
          space: post.spaceId ? { _id: post.spaceId._id, name: post.spaceId.name, logo: post.spaceId.logo } : null,
          hashtags: post.hashtags || [],
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    }

    // ── MCQ branch ──────────────────────────────────────────────────────
    if (type === "mcq") {
      if (!question || !question.trim()) {
        return res.status(400).json({
          success: false,
          message: "Question is required for MCQs",
        });
      }

      let options;
      try {
        options = typeof rawOptions === "string" ? JSON.parse(rawOptions) : rawOptions;
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid options format",
        });
      }

      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "MCQs must have at least 2 options",
        });
      }

      const hasCorrect = options.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        return res.status(400).json({
          success: false,
          message: "MCQs must have at least one correct option",
        });
      }

      const postData = {
        type: "mcq",
        headline: headline ? headline.trim() : null,
        content: question.trim(), // Satisfy required 'content' field
        mcq: {
          question: question.trim(),
          options: options.map(opt => ({
            text: opt.text || opt,
            isCorrect: !!opt.isCorrect,
            chosenBy: []
          })),
        },
        category: ['study', 'masti'].includes(category) ? category : 'study',
        spaceId: spaceId || null,
        hashtags: hashtags ? JSON.parse(hashtags) : [],
      };

      if (req.mentor) postData.mentorId = req.mentor._id;
      else if (req.user) postData.userId = req.user._id;

      const post = new Post(postData);
      await post.save();

      // Populate author
      if (post.mentorId) {
        await post.populate('mentorId', 'name username image');
      } else if (post.userId) {
        const user = await populateUser(post.userId);
        post.userId = user;
      }

      const author = post.mentorId
        ? { _id: post.mentorId._id, name: post.mentorId.name, username: post.mentorId.username, image: post.mentorId.image }
        : post.userId
          ? { _id: post.userId._id, name: post.userId.name, username: post.userId.username || null, image: post.userId.image }
          : null;

      // Notification logic
      (async () => {
        try {
          const authorDoc = req.mentor || req.user;
          const authorId = authorDoc._id;
          const authorName = author?.name || authorDoc.name || "Someone";
          const followers = authorDoc.followers || [];
          if (followers.length > 0) {
            await NotificationManager.createAndSendMultiple({
              recipientIds: followers,
              recipientRole: "user",
              actorId: authorId,
              type: "FOLLOWING_POST",
              entityType: "POST",
              entityId: post._id,
              originPath: `/posts/${post._id}`,
              message: `${authorName} posted a Q&A`,
              actorInfo: { name: authorName, username: author?.username },
            });
          }
        } catch (err) {
          console.error("Error sending MCQ notification:", err);
        }
      })();

      return res.status(201).json({
        success: true,
        message: "MCQ created successfully",
        post: {
          _id: post._id,
          mentor: author,
          author: author,
          type: "mcq",
          headline: post.headline,
          mcq: post.mcq,
          category: post.category || 'study',
          space: post.spaceId ? { _id: post.spaceId._id, name: post.spaceId.name, logo: post.spaceId.logo } : null,
          hashtags: post.hashtags || [],
          likesCount: 0,
          commentsCount: 0,
          createdAt: post.createdAt,
        },
      });
    }

    // ── REGULAR POST branch ──────────────────────────────────────────────
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required"
      });
    }

    // Detect URL and Link Preview
    const detectedUrl = detectUrl(content);
    let linkPreview = null;
    if (detectedUrl) {
      try { linkPreview = await generateLinkPreview(detectedUrl); } catch (e) { }
    }

    // Handle image upload (Multiple images)
    let imageUrl = null;
    let imagesUrls = [];
    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        imageUrl = await uploadToCloudinary(req.files.image[0].path, 'posts');
      }
      if (req.files.images && req.files.images.length > 0) {
        for (const file of req.files.images) {
          const uploadedUrl = await uploadToCloudinary(file.path, 'posts');
          imagesUrls.push(uploadedUrl);
        }
      }
    }

    const postData = {
      content: content.trim(),
      headline: headline ? headline.trim() : null,
      category: ['study', 'masti'].includes(category) ? category : 'study',
      spaceId: spaceId || null,
      image: imageUrl,
      images: imagesUrls,
      hashtags: hashtags ? JSON.parse(hashtags) : [],
    };

    if (req.mentor) postData.mentorId = req.mentor._id;
    else if (req.user) postData.userId = req.user._id;

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

    // Population and Author Info
    if (post.mentorId) await post.populate('mentorId', 'name username image');
    else if (post.userId) {
      const user = await populateUser(post.userId);
      post.userId = user;
    }

    const author = post.mentorId
      ? { _id: post.mentorId._id, name: post.mentorId.name, username: post.mentorId.username, image: post.mentorId.image }
      : post.userId
        ? { _id: post.userId._id, name: post.userId.name, username: post.userId.username || null, image: post.userId.image }
        : null;

    // Notifications
    (async () => {
      try {
        const actorId = req.mentor ? req.mentor._id : req.user._id;
        const actorRole = req.mentor ? 'mentor' : 'user';
        const actorName = author?.name || 'Someone';
        await createMentionNotifications(content, post._id, actorId, actorRole, actorName);

        const authorDoc = req.mentor || req.user;
        const followers = authorDoc.followers || [];
        if (followers.length > 0) {
          await NotificationManager.createAndSendMultiple({
            recipientIds: followers,
            recipientRole: 'user',
            actorId: actorId,
            type: 'FOLLOWING_POST',
            entityType: 'POST',
            entityId: post._id,
            originPath: `/posts/${post._id}`,
            message: `${actorName} posted something new`,
            actorInfo: { name: actorName, username: author?.username },
          });
        }
      } catch (err) {
        console.error('Error in post creation notifications:', err);
      }
    })();

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: {
        _id: post._id,
        mentor: author,
        author: author,
        headline: post.headline || null,
        content: post.content,
        category: post.category || 'study',
        image: post.image,
        images: post.images || [],
        hashtags: post.hashtags || [],
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
 * POST /api/posts/:postId/vote
 * Cast a vote in a poll
 */
router.post("/:postId/vote", authenticateRequired, async (req, res) => {
  try {
    const { optionId } = req.body;
    const userId = req.user?._id || req.mentor?._id;

    if (!optionId) {
      return res.status(400).json({ success: false, message: "Option ID is required" });
    }

    const post = await Post.findById(req.params.postId);

    if (!post || post.type !== "poll") {
      return res.status(404).json({ success: false, message: "Poll not found" });
    }

    // Find any existing option where the user has already voted and remove their vote
    post.poll.options.forEach(opt => {
      const index = opt.votedBy.findIndex(id => id.toString() === userId.toString());
      if (index > -1) {
        opt.votedBy.splice(index, 1);
      }
    });

    // Find the new option and add vote
    const option = post.poll.options.id(optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: "Option not found" });
    }

    option.votedBy.push(userId);
    await post.save();

    // Calculate percentages
    const totalVotes = post.poll.options.reduce((sum, opt) => sum + opt.votedBy.length, 0);
    const optionsWithPercentages = post.poll.options.map(opt => ({
      _id: opt._id,
      text: opt.text,
      votes: opt.votedBy.length,
      percentage: totalVotes > 0 ? Math.round((opt.votedBy.length / totalVotes) * 100) : 0
    }));

    res.json({
      success: true,
      poll: {
        options: optionsWithPercentages,
        totalVotes
      }
    });
  } catch (error) {
    console.error("Error voting in poll:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * POST /api/posts/:postId/mcq-answer
 * Submit an answer to an MCQ
 */
router.post("/:postId/mcq-answer", authenticateRequired, async (req, res) => {
  try {
    const { optionId } = req.body;
    const userId = req.user?._id || req.mentor?._id;

    if (!optionId) {
      return res.status(400).json({ success: false, message: "Option ID is required" });
    }

    const post = await Post.findById(req.params.postId);

    if (!post || post.type !== "mcq") {
      return res.status(404).json({ success: false, message: "MCQ not found" });
    }

    // Check if user already answered
    const alreadyAnswered = post.mcq.options.some(opt =>
      opt.chosenBy.some(id => id.toString() === userId.toString())
    );

    if (alreadyAnswered) {
      return res.status(400).json({ success: false, message: "You have already answered this question" });
    }

    // Find the option and add answer
    const option = post.mcq.options.id(optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: "Option not found" });
    }

    option.chosenBy.push(userId);
    await post.save();

    // Calculate percentages
    const totalAnswers = post.mcq.options.reduce((sum, opt) => sum + opt.chosenBy.length, 0);
    const optionsWithResults = post.mcq.options.map(opt => ({
      _id: opt._id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      votes: opt.chosenBy.length,
      percentage: totalAnswers > 0 ? Math.round((opt.chosenBy.length / totalAnswers) * 100) : 0
    }));

    const userSelectedOption = post.mcq.options.id(optionId);

    res.json({
      success: true,
      mcq: {
        question: post.mcq.question,
        options: optionsWithResults,
        totalAnswers,
        hasAnswered: true,
        userSelectedOptionId: optionId,
        isUserCorrect: userSelectedOption ? userSelectedOption.isCorrect : false
      }
    });
  } catch (error) {
    console.error("Error submitting MCQ answer:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * PUT /api/posts/:postId
 * Update a post (only the creator - mentor or user)
 */
router.put("/:postId", authenticateRequired, upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 5 }]), async (req, res) => {
  try {
    const { content, hashtags } = req.body;
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
      const willHaveImage = Boolean(req.file || post.image);
      if (!hasVisiblePostText(content) && !willHaveImage) {
        return res.status(400).json({
          success: false,
          message: "Post cannot be empty — add text or keep your image",
        });
      }
      post.content = content.trim();
      post.isEdited = true;
      post.editedAt = new Date();

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

    // Update hashtags if provided
    if (hashtags) {
      post.hashtags = JSON.parse(hashtags);
    }

    // Handle image upload
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
        post.image = await uploadToCloudinary(req.file.path, "posts");
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
        });
      }
    }

    await post.save();

    // Populate author info
    if (post.mentorId) {
      await post.populate("mentorId", "name username image");
    } else if (post.userId) {
      const user = await populateUser(post.userId);
      post.userId = user;
    }

    // Build author object
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

    // Create mention notifications if content was updated (async, don't block response)
    if (content && content.trim()) {
      (async () => {
        try {
          const actorId = req.mentor ? req.mentor._id : req.user._id;
          const actorRole = req.mentor ? "mentor" : "user";
          const actorName = author?.name || "Someone";
          await createMentionNotifications(content, post._id, actorId, actorRole, actorName);
        } catch (err) {
          console.error("Error creating mention notifications (update):", err);
        }
      })();
    }

    return res.json({
      success: true,
      message: "Post updated successfully",
      post: {
        _id: post._id,
        mentor: author,
        author: author,
        content: post.content,
        image: post.image,
        images: post.images || [],
        hashtags: post.hashtags || [],

        externalLink: post.externalLink,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isEdited: post.isEdited,
        editedAt: post.editedAt,
      },
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
/**
 * POST /api/posts/:postId/vote
 * Cast a vote on a poll option (authenticated users and mentors)
 * Rules:
 *   - One vote per user per poll (enforced via votedBy array)
 *   - Cannot change vote once cast
 *   - Only works on posts with type: "poll"
 */

router.post("/:postId/vote", authenticateRequired, async (req, res) => {
  try {
    const { optionId } = req.body;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: "optionId is required",
      });
    }


    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.type !== "poll") {
      return res.status(400).json({
        success: false,
        message: "This post is not a poll",
      });
    }

    // Get the voter's ID (works for both users and mentors)
    const voterId = req.user ? req.user._id : req.mentor._id;

    // Check if this user has already voted on ANY option
    const alreadyVoted = post.poll.options.some((opt) =>
      opt.votedBy.some((id) => id.toString() === voterId.toString()),
    );

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: "You have already voted on this poll",
      });
    }

    // Find the target option
    const targetOption = post.poll.options.id(optionId);

    // Cast the vote
    targetOption.votedBy.push(voterId);
    post.poll.totalVotes = (post.poll.totalVotes || 0) + 1;
    await post.save();

    // Populate author info
    let author = null;
    if (post.mentorId) {
      await post.populate("mentorId", "name username image");
      author = {
        _id: post.mentorId._id,
        name: post.mentorId.name,
        username: post.mentorId.username,
        image: post.mentorId.image,
      };
    } else if (post.userId) {
      author = await populateUser(post.userId);
    }

    return res.json({
      success: true,
      message: "Vote recorded",
      poll: {
        _id: post._id,
        question: post.poll.question,
        options: post.poll.options.map(opt => ({
          _id: opt._id,
          text: opt.text,
          votes: opt.votedBy.length,
        })),
        totalVotes: post.poll.totalVotes,
        author,
      },
    });
  } catch (error) {
    console.error("Error casting vote:", error);
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

    // Delete image from Cloudinary if exists
    if (post.image) {
      try {
        const publicId = getPublicIdFromUrl(post.image);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting image:', deleteError);
        // Continue with post deletion
      }
    }

    await Post.findByIdAndDelete(req.params.postId);

    if (post.mentorId) {
      const mentorId = post.mentorId.toString();

      const keys = await redis.keys(`mentorPosts:${mentorId}:page:*`);
      if (keys.length) await redis.del(keys);
    }

    //   clear user cache (if you have user posts API)
    if (post.userId) {
      const userId = post.userId.toString();

      const keys = await redis.keys(`userPosts:${userId}:page:*`);
      if (keys.length) await redis.del(keys);
    }

    res.json({ success: true, message: "Post deleted successfully" });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});




/**
 * PATCH /api/posts/:postId/category
 * Authenticated users OR mentors can change category on their own posts.
 * Mentors can also change category on ANY post (moderation).
 */
router.patch("/:postId/category", authenticateRequired, async (req, res) => {
  try {
    const { category } = req.body;

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Authorization: post owner OR any mentor (moderation)
    const isOwner =
      (req.mentor && post.mentorId && post.mentorId.toString() === req.mentor._id.toString()) ||
      (req.user && post.userId && post.userId.toString() === req.user._id.toString());
    const isMentor = Boolean(req.mentor);

    if (!isOwner && !isMentor) {
      return res.status(403).json({
        success: false,
        message: "You can only change the category of your own posts"
      });
    }

    post.category = category;
    await post.save();

    // Clear cache so new feeds reflect updated category
    // apiCache.clear('/api/posts');
    await Promise.all([
      redis.del(`feed:study`),
      redis.del(`feed:masti`)
    ])

    //   clear mentor cache
    if (post.mentorId) {
      const mentorId = post.mentorId.toString();

      const keys = await redis.keys(`mentorPosts:${mentorId}:page:*`);
      if (keys.length) await redis.del(keys);
    }

    //   clear user cache (if exists)
    if (post.userId) {
      const userId = post.userId.toString();

      const keys = await redis.keys(`userPosts:${userId}:page:*`);
      if (keys.length) await redis.del(keys);
    }
    res.json({
      success: true,
      message: `Post moved to '${category}' feed`,
      postId: post._id,
      category: post.category,
    });
  } catch (error) {
    console.error("Error updating post category:", error);
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
    //   clear mentor cache
    if (post.mentorId) {
      const mentorId = post.mentorId.toString();

      const keys = await redis.keys(`mentorPosts:${mentorId}:page:*`);
      if (keys.length) await redis.del(keys);
    }

    //   clear user cache (if applicable)
    if (post.userId) {
      const userId = post.userId.toString();

      const keys = await redis.keys(`userPosts:${userId}:page:*`);
      if (keys.length) await redis.del(keys);
    }
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

    const wasLiked = existingLikeIndex > -1;

    if (existingLikeIndex > -1) {
      post.likes.splice(existingLikeIndex, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push({ userId });
      post.likesCount = post.likesCount + 1;
    }

    await post.save();

    // Mark as engaged when user likes (only for users, not mentors)
    if (!wasLiked && req.user) {
      feedController.markPostAsEngaged(req.user._id, post._id, 'like', post).catch(err => {
        console.error('Error marking post as engaged (like):', err);
      });
    }

    //   clear feed cache (likes affect ranking)
    await Promise.all([
      redis.del(`feed:study`),
      redis.del(`feed:masti`)
    ]);

    //   update Redis like set
    try {
      if (wasLiked) {
        await redis.srem(`post:${post._id}:likes`, userId.toString());
      } else {
        await redis.sadd(`post:${post._id}:likes`, userId.toString());
      }
    } catch (err) {
      console.error("Redis like update failed:", err);
    }

    res.json({
      success: true,
      isLiked: !wasLiked,
      likesCount: post.likesCount,
    });

    // Notify post owner if it's a new like
    if (existingLikeIndex === -1) {
      (async () => {
        try {
          const actorId = req.user ? req.user._id : req.mentor._id;
          const actorName = (req.user ? req.user.name : req.mentor?.name) || 'Someone';
          const actorUsername = (req.user ? req.user.username : req.mentor?.username) || null;
          const recipientId = post.mentorId || post.userId;
          const recipientRole = post.mentorId ? 'mentor' : 'user';

          if (recipientId) {
            await NotificationManager.createAndSend({
              recipientId,
              recipientRole,
              actorId,
              type: 'POST_LIKE',
              entityType: 'POST',
              entityId: post._id,
              originPath: `/posts/${post._id}`,
              message: `${actorName} liked your post`,
              actorInfo: { name: actorName, username: actorUsername },
            });
          }
        } catch (err) {
          console.error('Error sending post like notification:', err);
        }
      })();
    }

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

    // Mark as engaged when user comments (only for users, not mentors)
    if (req.user) {
      feedController.markPostAsEngaged(req.user._id, post._id, 'comment', post).catch(err => {
        console.error('Error marking post as engaged (comment):', err);
      });
      trackStudentEvent({
        userId: req.user._id,
        eventType: 'comment_posted',
        entityId: newComment._id,
        post,
        metadata: { postId: post._id },
        dedupeWindowSeconds: 10,
      }).catch(err => {
        console.error('Error tracking comment_posted:', err);
      });
    }

    const user = req.user ? await populateUser(newComment.userId) : await populateMentor(newComment.userId);
    const userData = user || { _id: newComment.userId };

    // clear comments cache (MOST IMPORTANT)
    await redis.del(`post:${post._id}:comments:page:1`);

    // clear post detail cache (commentsCount changed)
    await redis.del(`post:${post._id}`);

    // clear feed cache (engagement affects ranking)
    await Promise.all([
      redis.del(`feed:study`),
      redis.del(`feed:masti`)
    ]);

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

    // Notify post owner
    (async () => {
      try {
        const actorId = req.user ? req.user._id : req.mentor._id;
        const actorName = (req.user ? req.user.name : req.mentor?.name) || 'Someone';
        const actorUsername = (req.user ? req.user.username : req.mentor?.username) || null;
        const recipientId = post.mentorId || post.userId;
        const recipientRole = post.mentorId ? 'mentor' : 'user';

        if (recipientId) {
          await NotificationManager.createAndSend({
            recipientId,
            recipientRole,
            actorId,
            type: 'COMMENT',
            entityType: 'COMMENT',
            entityId: newComment._id,
            originPath: `/posts/${post._id}#comment-${newComment._id}`,
            message: `${actorName} commented on your post`,
            actorInfo: { name: actorName, username: actorUsername },
          });
        }
      } catch (err) {
        console.error('Error sending comment notification:', err);
      }
    })();

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

      await redis.del(`feed:${originalPost.category || "study"}`);
      await redis.del(`post:${originalPost._id}`);

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
    await redis.del(`feed:${originalPost.category || "study"}`);
    await redis.del(`post:${originalPost._id}`);
    // Mark as engaged when user reposts (only for users, not mentors)
    if (req.user) {
      feedController.markPostAsEngaged(req.user._id, originalPost._id, 'repost', originalPost).catch(err => {
        console.error('Error marking post as engaged (repost):', err);
      });
    }

    res.json({
      success: true,
      message: "Post reposted successfully",
      repostCount: originalPost.repostCount,
      isReposted: true,
    });

    // Notify original post owner
    (async () => {
      try {
        const actorId = req.user ? req.user._id : req.mentor._id;
        const actorName = (req.user ? req.user.name : req.mentor?.name) || 'Someone';
        const actorUsername = (req.user ? req.user.username : req.mentor?.username) || null;
        const recipientId = originalPost.mentorId || originalPost.userId;
        const recipientRole = originalPost.mentorId ? 'mentor' : 'user';

        if (recipientId) {
          await NotificationManager.createAndSend({
            recipientId,
            recipientRole,
            actorId,
            type: 'REPOST',
            entityType: 'POST',
            entityId: originalPost._id,
            originPath: `/post/${originalPost._id}`,
            message: `${actorName} reposted your post`,
            actorInfo: { name: actorName, username: actorUsername },
          });
        }
      } catch (err) {
        console.error('Error sending repost notification:', err);
      }
    })();

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

    await redis.del(`post:${post._id}:comments:page:1`);

    res.json({
      success: true,
      isLiked: existingLikeIndex === -1,
      likesCount: comment.likesCount,
    });

    // Notify comment owner if it's a new like
    if (existingLikeIndex === -1) {
      (async () => {
        try {
          const actorId = req.user ? req.user._id : req.mentor._id;
          const actorName = (req.user ? req.user.name : req.mentor?.name) || 'Someone';
          const actorUsername = (req.user ? req.user.username : req.mentor?.username) || null;
          const recipientId = comment.userId;

          // Determine recipient role - need to check if it's a user or mentor
          // For now, assume user (could be enhanced to check actual role)
          const recipientRole = 'user';

          if (recipientId) {
            await NotificationManager.createAndSend({
              recipientId,
              recipientRole,
              actorId,
              type: 'COMMENT_LIKE',
              entityType: 'COMMENT',
              entityId: comment._id,
              originPath: `/posts/${post._id}#comment-${comment._id}`,
              message: `${actorName} liked your comment`,
              actorInfo: { name: actorName, username: actorUsername },
            });
          }
        } catch (err) {
          console.error('Error sending comment like notification:', err);
        }
      })();
    }

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

    await Promise.all([
      // comments changed
      redis.del(`post:${post._id}:comments:page:1`),

      // commentsCount changed
      redis.del(`post:${post._id}`),

      // engagement changed (reply = comment)
      redis.del(`feed:${post.category || "study"}`)
    ]);

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

    try {
      await Promise.all([
        // 🔥 comments changed
        redis.del(`post:${post._id}:comments:page:1`),

        // 🔥 commentsCount changed
        redis.del(`post:${post._id}`),

        // 🔥 engagement changed
        redis.del(`feed:${post.category || "study"}`)
      ]);
    } catch (err) {
      console.error("Redis invalidation failed:", err);
    }
    
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

/**
 * GET /api/posts/mentions/search
 * Search for users and mentors for mentions
 * Query params: q (search query)
 */
router.get("/mentions/search", async (req, res) => {
  try {
    const { q = "" } = req.query;

    if (!q.trim()) {
      return res.json({
        success: true,
        users: [],
        mentors: [],
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    // Search users and mentors in parallel
    const [users, mentors] = await Promise.all([
      User.find({
        $or: [
          { username: searchRegex },
          { name: searchRegex },
        ],
      })
        .select("name username image _id")
        .limit(10)
        .lean(),
      Mentor.find({
        $or: [
          { username: searchRegex },
          { name: searchRegex },
        ],
      })
        .select("name username image _id")
        .limit(10)
        .lean(),
    ]);

    // Format results
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      username: user.username,
      image: user.image,
      type: "user",
    }));

    const formattedMentors = mentors.map(mentor => ({
      _id: mentor._id,
      name: mentor.name,
      username: mentor.username,
      image: mentor.image,
      type: "mentor",
    }));

    // Combine and limit total results
    const allResults = [...formattedMentors, ...formattedUsers].slice(0, 10);

    res.json({
      success: true,
      results: allResults,
    });
  } catch (error) {
    console.error("Error searching mentions:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;