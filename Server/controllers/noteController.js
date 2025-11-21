const mongoose = require('mongoose');
const Note = require('../models/noteSchema');

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

