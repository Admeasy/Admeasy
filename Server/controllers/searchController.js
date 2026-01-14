const Blog = require("../models/blogSchema");
const Mentor = require("../models/mentorSchema");
const Note = require("../models/noteSchema");
const College = require("../models/collegeSchema");

// Helper function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

exports.globalSearch = async (req, res) => {
  try {
    const { q = "", type } = req.query;

    const results = {
      mentors: [],
      colleges: [],
      blogs: [],
      notes: []
    };

    // If no query, return random shuffled data
    if (!q.trim()) {
      /* ===================== MENTORS ===================== */
      if (!type || type === "mentors") {
        const allMentors = await Mentor.find({})
          .select(`
            name
            image
            imageUrl
            college
            course
            expertise
            notesUploaded
            username
          `)
          .limit(50)
          .lean(); // Get more to shuffle
        results.mentors = shuffleArray(allMentors).slice(0, 15);
      }

      /* ===================== COLLEGES ===================== */
      if (!type || type === "colleges") {
        const allColleges = await College.find({})
          .select(`
            name
            logo
            desc
            rating
            placements
            location
            city
            state
          `)
          .limit(50)
          .lean();
        results.colleges = shuffleArray(allColleges).slice(0, 15);
      }

      /* ===================== BLOGS ===================== */
      if (!type || type === "blogs") {
        const allBlogs = await Blog.find({})
          .select(`
            Author
            Title
            Thumbnail
            content
            category
            readingTime
            createdAt
          `)
          .limit(50)
          .lean();
        results.blogs = shuffleArray(allBlogs).slice(0, 15);
      }

      /* ===================== NOTES ===================== */
      if (!type || type === "notes") {
        const allNotes = await Note.find({})
          .select(`
            title
            description
            subject
            uploader
            uploaderName
            likes
            views
            createdAt
          `)
          .limit(50)
          .lean();
        results.notes = shuffleArray(allNotes).slice(0, 15);
      }

      return res.status(200).json({
        success: true,
        query: "",
        type: type || "all",
        results
      });
    }

    // If query exists, perform search
    const regex = new RegExp(q, "i");

    /* ===================== MENTORS ===================== */
    if (!type || type === "mentors") {
      results.mentors = await Mentor.find({
        $or: [
          { name: regex },
          { college: regex },
          { course: regex },
          { bio: regex },
          { expertise: regex },
          { username: regex }
        ]
      })
        .select(`
        name
        image
        imageUrl
        college
        course
        expertise
        notesUploaded
        username
          `)
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
          { state: regex }
        ]
      })
        .select(`
        name
        logo
        desc
        rating
        placements
        location
        city
        state
          `)
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
          { category: regex }
        ]
      })
        .select(`
        Author
        Title
        Thumbnail
        content
        category
        readingTime
        createdAt
          `)
        .limit(20)
        .lean();
    }

    /* ===================== NOTES ===================== */
    if (!type || type === "notes") {
      results.notes = await Note.find({
        $or: [
          { title: regex },
          { description: regex },
          { subject: regex },
          { uploaderName: regex } // ✅ STRING FIELD ONLY
        ]
      })
        .select(`
        title
        description
        subject
        uploader
        uploaderName
        likes
        views
        createdAt
          `)
        .limit(20)
        .lean();
    }

    return res.status(200).json({
      success: true,
      query: q,
      type: type || "all",
      results
    });

  } catch (error) {
    console.error("Global Search Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching"
    });
  }
};
