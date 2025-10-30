const express = require("express");
const router = express.Router();
const Blog = require("../models/BlogSchema");
const { verifyAdminToken } = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📂 Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads/blogs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⚙️ Multer config (store images in /uploads/blogs)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, WEBP allowed."));
    }
  },
});

// ✅ Get all blogs (public)
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (e) {
    console.error("Error fetching blogs:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get single blog by ID (public)
router.get("/:id", async (req, res) => {
  try {
    console.log("=== GET SINGLE BLOG ===");
    console.log("Blog ID:", req.params.id);
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      console.log("Blog not found");
      return res.status(404).json({ message: "Blog not found" });
    }
    
    console.log("Blog found:", blog.Title);
    res.json(blog);
  } catch (e) {
    console.error("Error fetching blog:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Create blog (admin only, with image upload)
router.post("/", verifyAdminToken, upload.single("Thumbnail"), async (req, res) => {
  try {
    console.log("=== CREATE BLOG REQUEST ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("Admin:", req.admin);

    const { Author, Title, content, category, readingTime } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!Author) missingFields.push("Author");
    if (!Title) missingFields.push("Title");
    if (!content) missingFields.push("content");
    if (!category) missingFields.push("category");
    if (!readingTime) missingFields.push("readingTime");

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(", ")}` 
      });
    }

    // Check if thumbnail was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Thumbnail is required" });
    }

    const blog = new Blog({
      Author,
      Title,
      content,
      category,
      readingTime: Number(readingTime),
      Thumbnail: `/uploads/blogs/${req.file.filename}`,
      createdBy: req.admin._id,
    });

    await blog.save();
    console.log("Blog created successfully:", blog._id);
    res.json({ message: "Blog created successfully!", blog });
  } catch (e) {
    console.error("Error creating blog:", e);
    res.status(500).json({ message: e.message || "Internal Server Error" });
  }
});

// ✅ Update blog (admin only, with optional image upload)
router.put("/:id", verifyAdminToken, upload.single("Thumbnail"), async (req, res) => {
  try {
    console.log("=== UPDATE BLOG REQUEST ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    
    const { id } = req.params;
    const { Author, Title, content, category, readingTime } = req.body;

    // Find existing blog
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const updateData = {
      Author,
      Title,
      content,
      category,
      readingTime: Number(readingTime),
      updatedBy: req.admin._id,
    };

    // If new thumbnail uploaded, update it
    if (req.file) {
      updateData.Thumbnail = `/uploads/blogs/${req.file.filename}`;
      
      // Delete old thumbnail
      if (existingBlog.Thumbnail) {
        const oldPath = path.join(__dirname, "..", existingBlog.Thumbnail);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
            console.log("Deleted old thumbnail:", oldPath);
          } catch (err) {
            console.error("Error deleting old thumbnail:", err);
          }
        }
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true });
    console.log("Blog updated successfully:", updatedBlog._id);
    res.json({ message: "Blog updated successfully!", blog: updatedBlog });
  } catch (e) {
    console.error("Error updating blog:", e);
    res.status(500).json({ message: e.message || "Internal Server Error" });
  }
});

// ✅ Delete blog (admin only)
router.delete("/:id", verifyAdminToken, async (req, res) => {
  try {
    console.log("=== DELETE BLOG REQUEST ===");
    const { id } = req.params;
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete thumbnail file if exists
    if (blog.Thumbnail) {
      const filePath = path.join(__dirname, "..", blog.Thumbnail);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log("Deleted thumbnail:", filePath);
        } catch (err) {
          console.error("Error deleting thumbnail:", err);
        }
      }
    }

    await Blog.findByIdAndDelete(id);
    console.log("Blog deleted successfully:", id);
    res.json({ message: "Blog deleted successfully" });
  } catch (e) {
    console.error("Error deleting blog:", e);
    res.status(500).json({ message: e.message || "Internal Server Error" });
  }
});

module.exports = router;