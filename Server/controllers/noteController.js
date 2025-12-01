const mongoose = require('mongoose');
const Note = require('../models/noteSchema');
const BackblazeB2Client = require('../b2Client');

const b2Client = new BackblazeB2Client();

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

// Upload note
exports.uploadNote = async (req, res) => {
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

    // Upload file to B2
    const fileName = `notes/${Date.now()}-${req.file.originalname}`;
    const result = await b2Client.uploadBuffer(req.file.buffer, fileName);

    // Construct the public URL for the uploaded file
    let baseUrl = process.env.B2_BUCKET_URL;
    if (baseUrl && baseUrl.startsWith('@')) {
        baseUrl = baseUrl.substring(1);
    }
    baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}`;
    const fileUrl = `${baseUrl}/${fileName}`;

    // Create note
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
      fileUrl,
      fileSize: req.file.size,
      uploader: req.mentor._id,
      uploaderName: req.mentor.name,
      status: 'pending'
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: 'Note uploaded successfully and is pending review',
      data: note
    });
  } catch (error) {
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

    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};


// Upload note
exports.uploadNote = async (req, res) => {
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

    // Upload file to B2
    const fileName = `notes/${Date.now()}-${req.file.originalname}`;
    const result = await b2Client.uploadBuffer(req.file.buffer, fileName);

    // Construct the public URL for the uploaded file
    let baseUrl = process.env.B2_BUCKET_URL;
    if (baseUrl && baseUrl.startsWith('@')) {
        baseUrl = baseUrl.substring(1);
    }
    baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}`;
    const fileUrl = `${baseUrl}/${fileName}`;

    // Create note
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
      fileUrl,
      fileSize: req.file.size,
      uploader: req.mentor._id,
      uploaderName: req.mentor.name,
      status: 'pending'
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: 'Note uploaded successfully and is pending review',
      data: note
    });
  } catch (error) {
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

    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};


// Upload note
exports.uploadNote = async (req, res) => {
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

    // Upload file to B2
    const fileName = `notes/${Date.now()}-${req.file.originalname}`;
    const result = await b2Client.uploadBuffer(req.file.buffer, fileName);

    // Construct the public URL for the uploaded file
    let baseUrl = process.env.B2_BUCKET_URL;
    if (baseUrl && baseUrl.startsWith('@')) {
        baseUrl = baseUrl.substring(1);
    }
    baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}`;
    const fileUrl = `${baseUrl}/${fileName}`;

    // Create note
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
      fileUrl,
      fileSize: req.file.size,
      uploader: req.mentor._id,
      uploaderName: req.mentor.name,
      status: 'pending'
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: 'Note uploaded successfully and is pending review',
      data: note
    });
  } catch (error) {
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

    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};