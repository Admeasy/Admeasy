const mongoose = require('mongoose');
const Note = require('../models/noteSchema');
const cloudinary = require('../config/cloudinary'); // or wherever your cloudinary config is
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const buildFilter = ({ search, university, programme, course }) => {
  const filter = { status: 'published' };

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { uploaderName: regex },
      { tags: regex },
    ];
  }

  if (university && university !== 'all') {
    filter.university = university.toLowerCase();
  }
  if (programme && programme !== 'all') {
    filter.programme = programme.toLowerCase();
  }
  if (course && course !== 'all') {
    filter.course = course.toLowerCase();
  }

  return filter;
};

// Helper function to write buffer to temporary file
const bufferToTempFile = async (buffer, originalFilename) => {
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, `upload-${Date.now()}-${originalFilename}`);
  await fs.writeFile(tempPath, buffer);
  return tempPath;
};

exports.getNotes = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const notes = await Note.find(filter).sort({ isFeatured: -1, likes: -1, createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch notes right now.' });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid note id.' });
    }

    const note = await Note.findById(req.params.id);

    if (!note || note.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch note right now.' });
  }
};

const updateCounter = async (req, res, field) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid note id.' });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, status: 'published' },
      { $inc: { [field]: 1 } },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error(`Error updating note ${field}:`, error);
    res.status(500).json({ success: false, message: `Unable to update ${field}.` });
  }
};

exports.likeNote = (req, res) => updateCounter(req, res, 'likes');
exports.viewNote = (req, res) => updateCounter(req, res, 'views');

// Upload note with Cloudinary compression
exports.uploadNote = async (req, res) => {
  let tempFilePath = null;
  console.log("Mentor from token:", req.mentor);
  try {
    const { title, description, standard, pages, isFree, price, university, programme, course, tags } = req.body;

    // Validate required fields
    if (!title || !description || !standard || !university || !programme || !course) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, standard, university, programme, course'
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Validate file size (10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size must be less than 10MB' });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
    }

    console.log('Original file size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');

    // Write buffer to temporary file for Cloudinary upload
    tempFilePath = await bufferToTempFile(req.file.buffer, req.file.originalname);

    // Upload to Cloudinary with compression (Ebook level)
    const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "auto",
      folder: "notes",
      access_mode: "public", 
      public_id: `${Date.now()}-${path.parse(req.file.originalname).name}`
    });

    console.log('Cloudinary upload successful:', cloudinaryResult.secure_url);
    console.log('Cloudinary file size:', (cloudinaryResult.bytes / 1024 / 1024).toFixed(2), 'MB');

    // Clean up temporary file
    await fs.unlink(tempFilePath).catch(err => console.error('Error deleting temp file:', err));
    tempFilePath = null;

    // Create note with Cloudinary URL
    const note = new Note({
      title: title.trim(),
      description: description.trim(),
      standard: standard.trim(),
      pages: pages ? parseInt(pages) : undefined,
      isFree: isFree === 'true' || isFree === true,
      price: price ? parseFloat(price) : undefined,
      university: university.trim().toLowerCase(),
      programme: programme.trim().toLowerCase(),
      course: course.trim().toLowerCase(),
      tags: tags ? tags.trim() : undefined,
      fileUrl: cloudinaryResult.secure_url,
      fileSize: cloudinaryResult.bytes,
      cloudinaryPublicId: cloudinaryResult.public_id, // Store for future deletion if needed
      uploader: req.mentor._id,
      uploaderName: req.mentor.name,
      status: 'pending'
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: 'Note uploaded successfully and is pending review',
      data: note,
      uploadInfo: {
        originalSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
        cloudinarySize: `${(cloudinaryResult.bytes / 1024 / 1024).toFixed(2)} MB`,
        savings: `${((1 - cloudinaryResult.bytes / req.file.size) * 100).toFixed(2)}%`,
        url: cloudinaryResult.secure_url
      }
    });
  } catch (error) {
    // Clean up temporary file on error
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }

    console.error('Error uploading note:', error);
    res.status(500).json({ success: false, message: 'Failed to upload note' });
  }
};

// Admin: Get all notes
exports.getAllNotes = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { uploaderName: regex },
        { tags: regex },
      ];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const notes = await Note.find(filter)
      .populate('uploader', 'email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching all notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notes' });
  }
};

// Admin: Update note
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, isFeatured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid note id' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    // If publishing, set publishedAt
    if (status === 'published') {
      updateData.publishedAt = new Date();
    }

    const note = await Note.findByIdAndUpdate(id, updateData, { new: true });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Failed to update note' });
  }
};

// Admin: Delete note
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid note id' });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Delete from Cloudinary if cloudinaryPublicId exists
    if (note.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(note.cloudinaryPublicId, { resource_type: 'raw' });
        console.log('File deleted from Cloudinary:', note.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await Note.findByIdAndDelete(id);

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};