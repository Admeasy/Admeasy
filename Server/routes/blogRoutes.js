const express = require("express");
const router = express.Router();
const Blog = require("../models/BlogSchema");
const { verifyAdminToken } = require("../middleware/adminAuth");

// ✅ Get all blogs (public)
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (e) {
    console.log(e);
    res.status(500).json("Internal Server Error");
  }
});

// ✅ Get single blog (public)
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json("Blog not found");
    res.json(blog);
  } catch (e) {
    console.log(e);
    res.status(500).json("Internal Server Error");
  }
});

// ✅ Create blog (admin only)
router.post("/", verifyAdminToken, async (req, res) => {
  try {
    const { Title, Thumbnail, content } = req.body;

    if (!Title || !Thumbnail || !content) {
      return res.status(400).json("Missing Fields");
    }

    const blog = new Blog({
      Author, // from adminAuth middleware
      Title,
      Thumbnail,
      content,
      createdBy: req.admin._id,
    });

    await blog.save();
    res.json("Blog created successfully!");
  } catch (e) {
    console.log(e);
    res.status(500).json("Internal Server Error");
  }
});

// ✅ Update blog (admin only)
router.put("/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: req.admin._id,
      },
      { new: true }
    );

    if (!updatedBlog) return res.status(404).json("Blog not found");
    res.json("Blog updated successfully!");
  } catch (e) {
    console.log(e);
    res.status(500).json("Internal Server Error");
  }
});

// ✅ Delete blog (admin only)
router.delete("/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return res.status(404).json("Blog not found");
    res.json("Blog deleted successfully");
  } catch (e) {
    console.log(e);
    res.status(500).json("Internal Server Error");
  }
});

module.exports = router;
