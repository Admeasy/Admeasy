const mongoose = require('mongoose');
const Note = require('../models/noteSchema');
const cloudinary = require('../config/cloudinary'); // or wherever your cloudinary config is
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { trackStudentEvent } = require('../services/interactionTrackingService');

const buildFilter = ({ search, university, programme, course, hashtag, uploader }) => { // Added hashtag
  const filter = { status: 'published' };

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { uploaderName: regex },
      { tags: regex },
      { hashtags: regex } // NEW
    ];
  }

  if (hashtag) {
    // If user clicks a tag, e.g. ?hashtag=React, find notes containing it
    filter.hashtags = { $in: [hashtag] }; 
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
  if (uploader) {
    filter.uploader = uploader;
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

exports.likeNote = async (req, res) => {
  await updateCounter(req, res, 'likes');
  if (req.user?._id) {
    const note = await Note.findById(req.params.id).select('tags hashtags title description').lean();
    trackStudentEvent({
      userId: req.user._id,
      eventType: 'note_like',
      entityId: req.params.id,
      note,
      dedupeWindowSeconds: 20,
    }).catch((err) => console.error('note_like tracking failed:', err));
  }
};

exports.viewNote = async (req, res) => {
  await updateCounter(req, res, 'views');
  if (req.user?._id) {
    const note = await Note.findById(req.params.id).select('tags hashtags title description').lean();
    trackStudentEvent({
      userId: req.user._id,
      eventType: 'note_open',
      entityId: req.params.id,
      note,
      dedupeWindowSeconds: 20,
    }).catch((err) => console.error('note_open tracking failed:', err));
  }
};

exports.shareNote = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid note id.' });
    }
    const note = await Note.findOne({ _id: req.params.id, status: 'published' }).lean();
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    if (req.user?._id) {
      await trackStudentEvent({
        userId: req.user._id,
        eventType: 'note_share',
        entityId: note._id,
        note,
        dedupeWindowSeconds: 20,
      });
    }
    return res.json({ success: true, message: 'Note share tracked' });
  } catch (error) {
    console.error('Error tracking note share:', error);
    return res.status(500).json({ success: false, message: 'Unable to track share.' });
  }
};

// Upload note with Cloudinary compression
exports.uploadNote = async (req, res) => {
  let tempFilePath = null;
  
  try {
    // Check for either a Mentor or a User
    const uploader = req.mentor || req.user;
    const uploaderType = req.mentor ? 'Mentor' : 'User';

    if (!uploader || !uploader._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please log in.' 
      });
    }

const { title, description, standard, pages, isFree, price, university, programme, course, tags, hashtags } = req.body;    // Validate required fields
const missingFields = [];
    if (!title || !title.trim()) missingFields.push('title');
    if (!description || !description.trim()) missingFields.push('description');
    if (!standard || !standard.trim()) missingFields.push('standard');
    if (!course || !course.trim()) missingFields.push('course');

    // ONLY require university and programme if it's a mentor
    if (uploaderType === 'Mentor') {
      if (!university || !university.trim()) missingFields.push('university');
      if (!programme || !programme.trim()) missingFields.push('programme');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please select a PDF file.' 
      });
    }

    // Validate file buffer
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'File is empty or corrupted. Please try uploading again.' 
      });
    }

    // Validate file size (10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false, 
        message: 'File size must be less than 10MB' 
      });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only PDF files are allowed' 
      });
    }

    console.log('Uploading note:', {
      title: title.trim(),
      mentorId: req.mentor._id,
      mentorName: req.mentor.name,
      fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      fileName: req.file.originalname
    });

    // Write buffer to temporary file for Cloudinary upload
    try {
      tempFilePath = await bufferToTempFile(req.file.buffer, req.file.originalname);
      console.log('Temporary file created:', tempFilePath);
    } catch (fileError) {
      console.error('Error creating temporary file:', fileError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to process file. Please try again.' 
      });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUD_NAME || !process.env.CLOUD_KEY || !process.env.CLOUD_SECRET) {
      console.error('Cloudinary configuration missing');
      // Clean up temp file
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error. Please contact support.' 
      });
    }

    // Upload to Cloudinary with compression
    let cloudinaryResult;
    try {
      cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: "auto",
        folder: "notes",
        access_mode: "public", 
        public_id: `${Date.now()}-${path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_')}`
      });
      console.log('Cloudinary upload successful:', cloudinaryResult.secure_url);
      console.log('Cloudinary file size:', (cloudinaryResult.bytes / 1024 / 1024).toFixed(2), 'MB');
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      // Clean up temp file
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }
      return res.status(500).json({ 
        success: false, 
        message: cloudinaryError.message || 'Failed to upload file to storage. Please try again.' 
      });
    }

    // Clean up temporary file
    try {
      await fs.unlink(tempFilePath);
      tempFilePath = null;
    } catch (unlinkError) {
      console.error('Error deleting temp file:', unlinkError);
      // Continue even if cleanup fails
    }

    // Validate Cloudinary response
    if (!cloudinaryResult || !cloudinaryResult.secure_url) {
      return res.status(500).json({ 
        success: false, 
        message: 'File upload completed but failed to get file URL. Please try again.' 
      });
    }

    // Create note with Cloudinary URL
    let note;
    try {
      note = new Note({
        title: title.trim(),
        description: description.trim(),
        standard: standard.trim(),
        pages: pages && pages.trim() ? parseInt(pages) : undefined,
        isFree: isFree === 'true' || isFree === true || isFree === 'true',
        price: price && price.trim() ? parseFloat(price) : undefined,
        university: university ? university.trim().toLowerCase() : 'general',
        programme: programme ? programme.trim().toLowerCase() : 'general',
        course: course.trim().toLowerCase(),
        tags: tags && tags.trim() ? tags.trim() : undefined,
        hashtags: hashtags ? JSON.parse(hashtags) : [], // NEW: Parse the incoming stringified array
        fileUrl: cloudinaryResult.secure_url,
        fileSize: cloudinaryResult.bytes,
        cloudinaryPublicId: cloudinaryResult.public_id,
        uploader: uploader._id,              // CHANGED
        uploaderModel: uploaderType,         // NEW
        uploaderName: uploader.name || 'Unknown', // CHANGED
        status: 'pending'
      });

      await note.save();
      console.log('Note saved successfully:', note._id);
    } catch (dbError) {
      console.error('Database error saving note:', dbError);
      // Try to delete from Cloudinary if database save fails
      if (cloudinaryResult && cloudinaryResult.public_id) {
        try {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id, { resource_type: 'raw' });
        } catch (deleteError) {
          console.error('Error deleting from Cloudinary after DB failure:', deleteError);
        }
      }
      return res.status(500).json({ 
        success: false, 
        message: dbError.message || 'Failed to save note. Please try again.' 
      });
    }

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
      try {
        await fs.unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Error deleting temp file in catch block:', unlinkError);
      }
    }

    console.error('Unexpected error uploading note:', {
      error: error.message,
      stack: error.stack,
      mentor: req.mentor ? req.mentor._id : 'not authenticated'
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload note. Please try again.';
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid data provided. Please check all fields.';
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage = 'Database error. Please try again in a moment.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
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

// Proxy PDF from Cloudinary with proper headers
// Server/controllers/noteController.js ke end mein

// Proxy PDF from Cloudinary directly using Redirect
exports.proxyPdf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid note id.' });
    }

    const note = await Note.findById(id);

    if (!note || note.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    if (!note.fileUrl) {
      return res.status(404).json({ success: false, message: 'PDF file not found.' });
    }

    let finalUrl = note.fileUrl;

    // Browser ke andar open karne ke liye (Download rokne ke liye) fl_inline add karein
    if (finalUrl.includes('cloudinary.com') && !finalUrl.includes('/fl_inline/')) {
      finalUrl = finalUrl.replace('/upload/', '/upload/fl_inline/');
    }

    // Node Server RAM bachane ke liye seedha Cloudinary par redirect karein
    return res.redirect(302, finalUrl);

  } catch (error) {
    console.error('Error proxying PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Error proxying PDF' });
    }
  }
};