const express = require("express");
const router = express.Router();
const Blog = require("../models/blogSchema");
const { verifyAdminToken } = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = require('../middleware/multer')
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary')

const getPublicIdFromUrl = (imageUrl) => {
    const parts = imageUrl.split('/upload/');
    if (parts.length < 2) {
        return null; // Not a valid Cloudinary URL format
    }
    const publicIdWithExtension = parts[1];
    const extensionName = path.extname(publicIdWithExtension);
    const publicId = publicIdWithExtension.replace(extensionName, '');
    return publicId;
};
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
    if(!req.file){
      return res.status(400).json({message : "Thumbnail is required"})
    }

    // Upload to Cloudinary
    const cloudUrl = await uploadToCloudinary(req.file.path,'blog_thumbnails')

    const blog = new Blog({
      Author,
      Title,
      content,
      category,
      readingTime: Number(readingTime),
      Thumbnail: cloudUrl,
      createdBy: req.admin._id,
    });
    // saving to database
    await blog.save();

    console.log("Blog created successfully:", blog);
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
    
    let newThumbnail = existingBlog.Thumbnail

    // If new thumbnail uploaded, update it
    if (req.file) {
      newThumbnail = await uploadToCloudinary(req.file.path,"blog_thumbnails")
    }

      const updateData = await Blog.findByIdAndUpdate(
        id,
    {
      Author,
      Title,
      content,
      category,
      readingTime: Number(readingTime),
      Thumbnail: newThumbnail,
      updatedBy: req.admin._id,
    },
    {new:true}
  );
  res.json({message:"Blog Updated Successfully!", blog: updateData})
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
    await Blog.findByIdAndDelete(id);
    if (blog.Thumbnail) {
      const publicId = getPublicIdFromUrl(blog.Thumbnail);
      await deleteFromCloudinary(publicId);
    }
    console.log("Blog deleted successfully:", id);
    res.json({ message: "Blog deleted successfully" });
  } catch (e) {
    console.error("Error deleting blog:", e);
    res.status(500).json({ message: e.message || "Internal Server Error" });
  }
});

module.exports = router;