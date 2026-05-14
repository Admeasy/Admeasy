const express = require("express");

const router = express.Router();

const {

  createComment,

  createReply,

  toggleLike,

  getComments,

  getReplies

} = require(
  "../controllers/cuetDiscussion"
);

const { authenticateOptional } = require('../middleware/combinedAuth');

// Apply optional authentication to discussion routes so logged-in users can be recognized
router.use(authenticateOptional);

// GET COMMENTS

// /api/cuetDiscussion routes

router.get(
  "/",
  getComments
);

// GET REPLIES

router.get(
  "/replies/:commentId",
  getReplies
);

// CREATE COMMENT

router.post(
  "/comment",
  createComment
);

// -----------------------------------
// CREATE REPLY
// -----------------------------------

router.post(
  "/reply",
  createReply
);

// -----------------------------------
// TOGGLE LIKE
// -----------------------------------

router.post(
  "/like/:id",
  toggleLike
);

module.exports = router;