const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const voteController = require('../controllers/voteController');
const commentController = require('../controllers/commentController');
const repostController = require('../controllers/repostController');
const { authenticateOptional, authenticateRequired } = require('../middleware/combinedAuth');
const upload = require('../middleware/multer');

// ==================== POST ROUTES ====================

/**
 * GET /api/posts
 * Get feed of posts (public, optional auth for userVote)
 */
router.get('/', authenticateOptional, postController.getPosts);

/**
 * GET /api/posts/:postId
 * Get single post (public, optional auth for userVote)
 */
router.get('/:postId', authenticateOptional, postController.getPost);

/**
 * POST /api/posts
 * Create a new post (requires auth - User or Mentor)
 */
router.post('/', authenticateRequired, upload.single('image'), postController.createPost
);

/**
 * PUT /api/posts/:postId
 * Update a post (requires auth - User or Mentor, must be author)
 */
router.put('/:postId', authenticateRequired, upload.single('image'), postController.updatePost
);

/**
 * DELETE /api/posts/:postId
 * Delete a post (requires auth - User or Mentor, must be author)
 */
router.delete('/:postId', authenticateRequired, postController.deletePost);

// ==================== VOTE ROUTES ====================

/**
 * POST /api/posts/:postId/vote
 * Vote on a post (upvote or downvote)
 * Body: { value: 1 } for upvote, { value: -1 } for downvote
 */
router.post('/:postId/vote', authenticateRequired, voteController.votePost);

// ==================== COMMENT ROUTES ====================

/**
 * GET /api/posts/:postId/comments
 * Get comments for a post
 * Query: ?parentCommentId=<id> to get nested replies
 */
router.get('/:postId/comments', commentController.getComments);

/**
 * POST /api/posts/:postId/comments
 * Create a comment (or reply)
 * Body: { content: "...", parentCommentId: "<id>" } (parentCommentId optional)
 */
router.post('/:postId/comments', authenticateRequired, commentController.createComment);

/**
 * PUT /api/comments/:commentId
 * Update a comment (requires auth, must be author)
 */
router.put('/comments/:commentId', authenticateRequired, commentController.updateComment);

/**
 * DELETE /api/comments/:commentId
 * Delete a comment (requires auth, must be author)
 */
router.delete('/comments/:commentId', authenticateRequired, commentController.deleteComment);

// ==================== REPOST ROUTES ====================

/**
 * POST /api/posts/:postId/repost
 * Repost a post
 * Body: { content: "..." } (optional comment)
 */
router.post('/:postId/repost', authenticateRequired, repostController.repost);

module.exports = router;

