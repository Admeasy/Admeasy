const CuetDiscussions = require(
  "../models/CuetDiscussions"
);
const {
  checkDiscussionRateLimit
} = require(
  "../utils/discussionRateLimit"
);

// -----------------------------------
// RANDOM ANONYMOUS NAMES
// -----------------------------------

const anonymousNames = [
  "Anonymous_rathee :-)",
  "Unemployed_anime_lover",
  "Washma_bhutt",
  "rebel_kidd",
  "Dumb_Student",
  "Future_ElonMusk",
  "cuetMinati",
  "General_Category_student:(",
  "That_one_gay_guy",
  "Viral_Link_founder",
  "DU_ka_14",
  "Friendzoned",
  "Mentally_in_North_Campus",
  "CUET_trauma_patient",
  "Pizza_burger_khaneWala",
];

const randomName = () => {
  return anonymousNames[
    Math.floor(
      Math.random() *
      anonymousNames.length
    )
  ];
};

const getIdentityFromAuth = ({ user, mentor }) => {
  if (mentor) {
    return {
      role: 'mentor',
      isAnonymous: false,
      displayName: mentor.name || mentor.username || 'Mentor',
      username: mentor.username || null,
      avatar: mentor.image || mentor.avatar || mentor.imageUrl || '',
      userId: mentor._id,
      userModel: 'Mentors',
      badge: 'Mentor'
    };
  }

  if (user) {
    return {
      role: user.role || 'student',
      isAnonymous: false,
      displayName: user.name || user.username || 'Student',
      username: user.username || null,
      avatar: user.image || user.avatar || user.imageUrl || '',
      userId: user._id,
      userModel: 'Users',
      badge: ''
    };
  }

  return {
    role: 'guest',
    isAnonymous: true,
    displayName: randomName(),
    username: null,
    avatar: '',
    userId: null,
    userModel: null,
    badge: ''
  };
};

// -----------------------------------
// GET COMMENTS
// -----------------------------------

exports.getComments = async (
  req,
  res
) => {

  try {

    const {
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters"
      });
    }

    // Build query for comments only
    const query = {
      type: "comment",
      status: "visible"
    };

    // Get total count
    const totalComments = await CuetDiscussions.countDocuments(query);

    // Calculate pagination
    const totalPages = Math.ceil(totalComments / limitNum);
    const hasMore = pageNum < totalPages;

    // Fetch comments with pagination
    const comments = await CuetDiscussions
      .find(query)
      .select(
        "_id displayName username avatar role content likesCount repliesCount createdAt course stream category isPinned isAnonymous"
      )
      .sort({
        isPinned: -1,
        createdAt: -1
      })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Transform to exclude sensitive fields
    const sanitizedComments = comments.map(c => ({
      _id: c._id,
      displayName: c.displayName,
      username: c.username,
      avatar: c.avatar,
      role: c.role,
      content: c.content,
      likesCount: c.likesCount || 0,
      repliesCount: c.repliesCount || 0,
      createdAt: c.createdAt,
      course: c.course,
      stream: c.stream,
      category: c.category,
      isPinned: c.isPinned,
      isAnonymous: c.isAnonymous
    }));

    return res.status(200).json({
      success: true,
      comments: sanitizedComments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore,
        totalComments
      }
    });

  }

  catch (err) {

    console.error(
      "Get Comments Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });

  }

};

// -----------------------------------
// GET REPLIES
// -----------------------------------

exports.getReplies = async (
  req,
  res
) => {

  try {

    const { commentId } = req.params;
    const {
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters"
      });
    }

    // Check if parent comment exists
    const parentComment = await CuetDiscussions.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: "Parent comment not found"
      });
    }

    // Build query for replies
    const query = {
      type: "reply",
      parentCommentId: commentId,
      status: "visible"
    };

    // Get total count
    const totalReplies = await CuetDiscussions.countDocuments(query);

    // Calculate pagination
    const totalPages = Math.ceil(totalReplies / limitNum);
    const hasMore = pageNum < totalPages;

    // Fetch replies with pagination
    const replies = await CuetDiscussions
      .find(query)
      .select(
        "_id displayName username avatar role content likesCount createdAt isAnonymous"
      )
      .sort({
        createdAt: 1
      })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Transform to exclude sensitive fields
    const sanitizedReplies = replies.map(r => ({
      _id: r._id,
      displayName: r.displayName,
      username: r.username,
      avatar: r.avatar,
      role: r.role,
      content: r.content,
      likesCount: r.likesCount || 0,
      createdAt: r.createdAt,
      isAnonymous: r.isAnonymous
    }));

    return res.status(200).json({
      success: true,
      replies: sanitizedReplies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore,
        totalReplies
      }
    });

  }

  catch (err) {

    console.error(
      "Get Replies Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });

  }

};

// -----------------------------------
// CREATE COMMENT
// -----------------------------------

exports.createComment = async (
  req,
  res
) => {

  try {

    const {
      content,
      course,
      stream,
      category,
      score
    } = req.body;

    console.log("Create Comment Request:", {
      content: content ? content.substring(0, 50) : "missing",
      hasUser: !!req.user,
      hasMentor: !!req.mentor
    });

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (
      !content ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Comment cannot be empty."
      });
    }

    // -----------------------------
    // USER DETECTION
    // -----------------------------

    const identity = getIdentityFromAuth({ user: req.user || null, mentor: req.mentor || null });

    const {
      role,
      isAnonymous,
      displayName,
      username,
      avatar,
      userId,
      userModel,
      badge
    } = identity;

    // -----------------------------
    // RATE LIMIT
    // -----------------------------

    const rateLimit =
      await checkDiscussionRateLimit({

        action: "comment",

        userId,

        ip: req.ip

      });

    if (!rateLimit.success) {

      return res.status(429).json({
        success: false,
        message:
          rateLimit.message
      });

    }

    // -----------------------------
    // CREATE COMMENT
    // -----------------------------

    const comment =
      await CuetDiscussions.create({

        type: "comment",

        content:
          content.trim(),

        course,
        stream,
        category,
        score,

        role,
        isAnonymous,

        displayName,
        username,
        avatar,

        userId,
        userModel,

        badge

      });

    console.log(
      "Comment Created Successfully:",
      comment._id
    );

    return res.status(201).json({

      success: true,

      message:
        "Comment posted successfully.",

      comment

    });

  }

  catch (err) {

    console.error(
      "Create Comment Error:",
      err.message,
      err.stack
    );

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error"
    });

  }

};

// -----------------------------------
// CREATE REPLY
// -----------------------------------

exports.createReply = async (
  req,
  res
) => {

  try {

    const {
      parentCommentId,
      content
    } = req.body;

    console.log("Create Reply Request:", {
      parentCommentId,
      content: content ? content.substring(0, 50) : "missing",
      hasUser: !!req.user,
      hasMentor: !!req.mentor
    });

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (
      !parentCommentId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Parent comment id is required."
      });
    }

    if (
      !content ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reply cannot be empty."
      });
    }

    // -----------------------------
    // CHECK PARENT COMMENT
    // -----------------------------

    const parentComment =
      await CuetDiscussions.findById(
        parentCommentId
      );

    if (!parentComment) {

      return res.status(404).json({
        success: false,
        message:
          "Parent comment not found."
      });

    }

    // -----------------------------
    // USER DETECTION
    // -----------------------------

    const identity = getIdentityFromAuth({ user: req.user || null, mentor: req.mentor || null });

    const {
      role,
      isAnonymous,
      displayName,
      username,
      avatar,
      userId,
      userModel,
      badge
    } = identity;

    // -----------------------------
    // RATE LIMIT
    // -----------------------------

    const rateLimit =
      await checkDiscussionRateLimit({

        action: "reply",

        userId,

        ip: req.ip

      });

    if (!rateLimit.success) {

      return res.status(429).json({
        success: false,
        message:
          rateLimit.message
      });

    }

    // -----------------------------
    // CREATE REPLY
    // -----------------------------

    const reply =
      await CuetDiscussions.create({

        type: "reply",

        parentCommentId,

        content:
          content.trim(),

        role,
        isAnonymous,

        displayName,
        username,
        avatar,

        userId,
        userModel,

        badge

      });

    console.log(
      "Reply Created Successfully:",
      reply._id
    );

    // -----------------------------
    // UPDATE PARENT
    // -----------------------------

    await CuetDiscussions.findByIdAndUpdate(

      parentCommentId,

      {
        $inc: {
          repliesCount: 1
        },

        lastActivityAt:
          new Date()
      }

    );

    return res.status(201).json({

      success: true,

      message:
        "Reply posted successfully.",

      reply

    });

  }

  catch (err) {

    console.error(
      "Create Reply Error:",
      err.message,
      err.stack
    );

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error"
    });

  }

};

// -----------------------------------
// TOGGLE LIKE
// -----------------------------------

exports.toggleLike = async (
  req,
  res
) => {

  try {

    const { id } = req.params;

    const user =
      req.user || null;

    const mentor =
      req.mentor || null;

    const identifier =
      user?._id ||
      mentor?._id ||
      req.ip;

    console.log("Toggle Like Request:", {
      commentId: id,
      identifier: String(identifier).substring(0, 20),
      hasUser: !!user,
      hasMentor: !!mentor
    });

    // -----------------------------
    // RATE LIMIT
    // -----------------------------

    const rateLimit =
      await checkDiscussionRateLimit({

        action: "like",

        userId:
          user?._id ||
          mentor?._id,

        ip: req.ip

      });

    if (!rateLimit.success) {

      return res.status(429).json({
        success: false,
        message:
          rateLimit.message
      });

    }

    // -----------------------------
    // FIND COMMENT
    // -----------------------------

    const comment =
      await CuetDiscussions.findById(
        id
      );

    if (!comment) {

      return res.status(404).json({
        success: false,
        message:
          "Comment not found."
      });

    }

    // -----------------------------
    // CHECK EXISTING LIKE
    // -----------------------------

    const alreadyLiked =
      comment.likedBy.some(

        (like) =>
          like.userId ===
          String(identifier)

      );

    // Unlike
    if (alreadyLiked) {

      comment.likedBy =
        comment.likedBy.filter(

          (like) =>
            like.userId !==
            String(identifier)

        );

      comment.likesCount =
        Math.max(
          0,
          comment.likesCount - 1
        );

    }

    // Like
    else {

      comment.likedBy.push({
        userId:
          String(identifier)
      });

      comment.likesCount += 1;

    }

    await comment.save();

    console.log(
      "Like Toggle Successful:",
      alreadyLiked ? "Unlike" : "Like"
    );

    return res.status(200).json({

      success: true,

      liked:
        !alreadyLiked,

      likesCount:
        comment.likesCount

    });

  }

  catch (err) {

    console.error(
      "Toggle Like Error:",
      err.message,
      err.stack
    );

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error"
    });

  }

};