const Blog = require("../models/blogSchema");
const Mentor = require("../models/mentorSchema");
const Note = require("../models/noteSchema");
const { attachAuthorsToNotes } = require("../utils/noteAuthor");
const College = require("../models/collegeSchema");
const Post = require("../models/postSchema");
const { Users } = require("../db");
const { trackStudentEvent } = require('../services/interactionTrackingService');

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

exports.globalSearch = async (req, res) => {
  try {
    const { q = "", type } = req.query;
    if (req.user?._id && q && q.trim()) {
      trackStudentEvent({
        userId: req.user._id,
        eventType: 'search_query',
        metadata: { query: q.trim(), type: type || 'all' },
        dedupeWindowSeconds: 10,
      }).catch((err) => console.error('search_query tracking failed:', err));
    }

    const results = {
      mentors: [],
      colleges: [],
      blogs: [],
      notes: [],
      posts: [],
    };

    // If no query, return random shuffled data
    if (!q.trim()) {
      /* ===================== MENTORS ===================== */
      if (!type || type === "mentors") {
        const allMentors = await Mentor.find({})
          .select(
            `name image imageUrl college course expertise notesUploaded username competitiveExamsCleared`,
          )
          .limit(50)
          .lean();
        // Put IIT/JEE mentors first, then shuffle the rest
        const isIITMentor = (m) => {
          const collegeStr = (m.college?.name || m.college || "").toLowerCase();
          const exams = (m.competitiveExamsCleared || [])
            .map((e) => (e?.name || e || "").toLowerCase())
            .join(" ");
          return (
            collegeStr.includes("iit") ||
            collegeStr.includes("jee") ||
            exams.includes("iit") ||
            exams.includes("jee")
          );
        };
        const iitMentors = allMentors.filter(isIITMentor);
        const otherMentors = allMentors.filter((m) => !isIITMentor(m));
        results.mentors = [
          ...shuffleArray(iitMentors),
          ...shuffleArray(otherMentors),
        ].slice(0, 15);
      }

      /* ===================== COLLEGES ===================== */
      if (!type || type === "colleges") {
        const allColleges = await College.find({})
          .select(`name logo desc rating placements location city state`)
          .limit(50)
          .lean();
        results.colleges = shuffleArray(allColleges).slice(0, 15);
      }

      /* ===================== BLOGS ===================== */
      if (!type || type === "blogs") {
        const allBlogs = await Blog.find({})
          .select(
            `Author Title Thumbnail content category readingTime createdAt hashtags`,
          )
          .limit(50)
          .lean();
        results.blogs = shuffleArray(allBlogs).slice(0, 15);
      }

      /* ===================== NOTES ===================== */
      if (!type || type === "notes") {
        const allNotes = await Note.find({ status: "published" })
          .select(
            `title description course university uploader uploaderModel uploaderName likes views createdAt publishedAt hashtags`,
          )
          .limit(50)
          .lean();
        const withAuthors = await attachAuthorsToNotes(allNotes);
        results.notes = shuffleArray(withAuthors).slice(0, 15);
      }

      /* ===================== POSTS ===================== */
      // if (!type || type === "posts") {
      //   const allPosts = await Post.find({})
      //     .populate('mentorId', 'name username image')
      //     .limit(50)
      //     .lean();

      //   // Safely map authors to prevent frontend crashes
      //   const formattedPosts = allPosts.map(post => ({
      //     ...post,
      //     author: post.mentorId || {
      //       name: 'Student',
      //       image: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
      //     }
      //   }));
      //   results.posts = shuffleArray(formattedPosts).slice(0, 15);
      // }
      if (!type || type === "posts") {
        const allPosts = await Post.find({})
          .populate("mentorId", "name username image")
          .limit(50)
          .lean();

        // Safely map authors to prevent frontend crashes
        const userIds = allPosts
          .filter((p) => p.userId)
          .map((p) => p.userId.toString());
        const UserModel = Users.model(`Users`);
        const users = await UserModel.find({ _id: { $in: userIds } })
          .select("name image username _id")
          .lean();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const formattedPosts = allPosts.map((post) => ({
          ...post,
          author: post.mentorId
            ? {
                _id: post.mentorId._id,
                name: post.mentorId.name,
                username: post.mentorId.username,
                image: post.mentorId.image,
              }
            : post.userId
              ? userMap.get(post.userId.toString()) || {
                  _id: post.userId,
                  name: "Deleted User",
                  username: null,
                  image: null,
                }
              : { name: "Deleted User", image: null },
        }));
        results.posts = shuffleArray(formattedPosts).slice(0, 15);
      }

      return res.status(200).json({
        success: true,
        query: "",
        type: type || "all",
        results,
      });
    }

    // Clean query (removes '#' so searching '#jee' perfectly matches 'jee' in db)
    const cleanQuery = q.trim().replace(/^#/, "");
    const regex = new RegExp(cleanQuery, "i");

    /* ===================== MENTORS ===================== */
    if (!type || type === "mentors") {
      results.mentors = await Mentor.find({
        $or: [
          { name: regex },
          { college: regex },
          { course: regex },
          { bio: regex },
          { expertise: regex },
          { username: regex },
        ],
      })
        .select(
          `name image imageUrl college course expertise notesUploaded username`,
        )
        .limit(20)
        .lean();
    }

    /* ===================== COLLEGES ===================== */
    if (!type || type === "colleges") {
      results.colleges = await College.find({
        $or: [
          { name: regex },
          { desc: regex },
          { location: regex },
          { city: regex },
          { state: regex },
        ],
      })
        .select(`name logo desc rating placements location city state`)
        .limit(20)
        .lean();
    }

    /* ===================== BLOGS ===================== */
    if (!type || type === "blogs") {
      results.blogs = await Blog.find({
        $or: [
          { Title: regex },
          { content: regex },
          { Author: regex },
          { category: regex },
          { hashtags: regex },
        ],
      })
        .select(
          `Author Title Thumbnail content category readingTime createdAt hashtags`,
        )
        .limit(20)
        .lean();
    }

    /* ===================== NOTES ===================== */
    if (!type || type === "notes") {
      const foundNotes = await Note.find({
        status: "published",
        $or: [
          { title: regex },
          { description: regex },
          { course: regex },
          { uploaderName: regex },
          { hashtags: regex },
        ],
      })
        .select(
          `title description course university uploader uploaderModel uploaderName likes views createdAt publishedAt hashtags`,
        )
        .limit(20)
        .lean();
      results.notes = await attachAuthorsToNotes(foundNotes);
    }

    /* ===================== POSTS ===================== */
    // if (!type || type === "posts") {
    //   const foundPosts = await Post.find({
    //     $or: [{ content: regex }, { hashtags: regex }],
    //   })
    //     .populate("mentorId", "name username image")
    //     .limit(20)
    //     .lean();

    //   // Safely map authors
    //   results.posts = foundPosts.map((post) => ({
    //     ...post,
    //     author: post.mentorId || {
    //       name: "Student",
    //       image:
    //         "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    //     },
    //   }));
    // }
    if (!type || type === "posts") {
      const foundPosts = await Post.find({
        $or: [{ content: regex }, { hashtags: regex }],
      })
        .populate("mentorId", "name username image")
        .limit(20)
        .lean();

      const userIds = foundPosts
        .filter((p) => p.userId)
        .map((p) => p.userId.toString());
      const UserModel = Users.model("Users");
      const users = await UserModel.find({ _id: { $in: userIds } })
        .select("name image username _id")
        .lean();
      const usersMap = new Map(users.map((u) => [u._id.toString(), u]));

      results.posts = foundPosts.map((post) => ({
        ...post,
        author: post.mentorId
          ? {
              _id: post.mentorId._id,
              name: post.mentorId.name,
              username: post.mentorId.username,
              image: post.mentorId.image,
            }
          : post.userId
            ? usersMap.get(post.userId.toString()) || {
                _id: post.userId,
                name: "Deleted User",
                username: null,
                image: null,
              }
            : { name: "Deleted User", image: null },
      }));
    }

    return res.status(200).json({
      success: true,
      query: q,
      type: type || "all",
      results,
    });
  } catch (error) {
    console.error("Global Search Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching",
    });
  }
};
