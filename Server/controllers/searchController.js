const Blog = require("../models/BlogSchema");
const Mentor = require("../models/mentorSchema");
const Note = require("../models/noteSchema");
const College = require("../models/collegeSchema");

exports.globalSearch = async (req, res) => {
  try {
    const { q = "", type } = req.query;

    if (!q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const regex = new RegExp(q, "i");

    const results = {
      mentors: [],
      colleges: [],
      blogs: [],
      notes: []
    };

    /* ===================== MENTORS ===================== */
    if (!type || type === "mentors") {
      results.mentors = await Mentor.find({
        $or: [
          { name: regex },
          { college: regex },
          { course: regex },
          { bio: regex },
          { expertise: regex },
          {username: regex}
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
        .limit(20);
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
        .limit(20);
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
        .limit(20);
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
        .limit(20);
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
