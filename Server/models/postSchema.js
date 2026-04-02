const mongoose = require("mongoose");
const { Admeasy } = require("../db");

const postSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["post", "poll", "mcq", "notes"],
      default: "post",
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor", // Fixed: Changed from 'Mentors' to 'Mentor' to match model registration
      required: false, // Made optional to support user posts
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: false, // Made optional to support mentor posts
    },
    // headline: Optional for new posts; null for old posts (handle in rendering layer)
    headline: {
      type: String,
      default: null,
      trim: true,
    },
    content: {
      type: String,
      required: false, //was required true before implementing poll and mcq
      trim: true,
      default: null,
    },
    // category: 'study' | 'masti'. Defaults to 'study' for all existing posts.
    category: {
      type: String,
      enum: ['study', 'masti'],
      default: 'study',
    },
    // spaceId: Optional. Not required for old posts.
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      default: null,
    },
    hashtags: [{          // NEW: Array of strings for hashtags
      type: String,
      trim: true,
    }],
    image: {
      type: String, // Cloudinary URL
      default: null,
    },
    externalLink: {
      url: {
        type: String,
        trim: true,
        default: null,
      },
      preview: {
        title: {
          type: String,
          trim: true,
          default: null,
        },
        description: {
          type: String,
          trim: true,
          default: null,
        },
        favicon: {
          type: String,
          default: null,
        },
        image: {
          type: String,
          default: null,
        },
        domain: {
          type: String,
          trim: true,
          default: null,
        },
        platform: {
          type: String,
          enum: ["youtube", "website", "other"],
          default: "website",
        },
      },
    },

    //add poll doc
    poll: {
      question: {
        type: String,
        trim: true,
        default: null,
      },
      options: [
        {
          text: {
            type: String,
            trim: true,
            required: true,
          },
          votes: {
            type: Number,
            default: 0,
          },
          // Store IDs of users/mentors who voted for this option
          // Used to enforce one-vote-per-user rule
          votedBy: [
            {
              type: mongoose.Schema.Types.ObjectId,
              //can be either mentor or user, so we won't use ref here,stored raw object id
            },
          ],
        },
      ],
      //total unique voters across all options (for quick display)
      totalVotes: {
        type: Number,
        default: 0,
      },
    },

    // MCQ (single correct answer) — future-ready for quizzes / learning analytics
    mcq: {
      question: {
        type: String,
        trim: true,
        default: null,
      },
      options: [
        {
          text: {
            type: String,
            trim: true,
            required: true,
          },
          isCorrect: {
            type: Boolean,
            default: false,
          },
          answeredBy: [
            {
              type: mongoose.Schema.Types.ObjectId,
            },
          ],
        },
      ],
      totalAnswers: {
        type: Number,
        default: 0,
      },
    },

    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        likes: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Users",
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        likesCount: {
          type: Number,
          default: 0,
        },
        parentCommentId: {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
        },
        deleted: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      default: null,
    },
    repostCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

//content only required for type post, not for poll or mcq or notes
//polls require poll.question and poll.options instead
// Validation: At least one of mentorId or userId must be present
postSchema.pre("validate", function (next) {
  if (!this.mentorId && !this.userId) {
    return next(new Error("Either mentorId or userId must be provided"));
  }
  if (this.mentorId && this.userId) {
    return next(new Error("Post cannot have both mentorId and userId"));
  }
  if (this.type === "post" && (!this.content || !this.content.trim())) {
    return next(new Error("Content is required for post type"));
  }
  if (this.type === "poll") {
    if (!this.poll || !this.poll.question || !this.poll.question.trim()) {
      return next(new Error("Poll question is required for poll type"));
    }
    if (!this.poll.options || this.poll.options.length < 2) {
      return next(new Error("Poll must have at least 2 options"));
    }
    if (this.poll.options.length > 4) {
      return next(new Error("Poll cannot have more than 4 options"));
    }
  }
  if (this.type === "mcq") {
    if (!this.mcq || !this.mcq.question || !this.mcq.question.trim()) {
      return next(new Error("MCQ question is required for mcq type"));
    }
    if (!this.mcq.options || this.mcq.options.length !== 4) {
      return next(new Error("MCQ must have exactly 4 options"));
    }
    const correctCount = this.mcq.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      return next(new Error("MCQ must have exactly one correct option"));
    }
    for (const o of this.mcq.options) {
      if (!o.text || !String(o.text).trim()) {
        return next(new Error("All MCQ options must have text"));
      }
    }
  }
  next();
});

// Indexes for efficient queries
postSchema.index({ hashtags: 1 });
postSchema.index({ mentorId: 1, createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ "comments.deleted": 1, "comments.createdAt": 1 });
postSchema.index({ "comments.parentCommentId": 1 });
// Compound index for feed queries
postSchema.index({ createdAt: -1, likesCount: -1 });
// Index for dual-channel feed filtering
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ spaceId: 1, createdAt: -1 });

module.exports = Admeasy.models.PPosts || Admeasy.model("Posts", postSchema);
