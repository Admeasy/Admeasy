const Note = require('../models/noteSchema');
const { extractTextFromPDFUrl, summarizeText, chatWithText } = require('../services/aiService');

/**
 * @desc Summarize Note / PDF
 * @route POST /api/ai/summarize-note
 */
exports.summarizeNote = async (req, res) => {
  try {
    const { noteId } = req.body;

    if (!noteId) {
      return res.status(400).json({ success: false, message: 'Note ID is required' });
    }

    let note;
    try {
      note = await Note.findById(noteId);
    } catch (err) {
      console.error('Invalid Note ID format:', noteId);
      return res.status(400).json({ success: false, message: 'Invalid Note ID format' });
    }

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found in database' });
    }

    // Return cached summary if available
    if (note.aiSummary) {
      return res.status(200).json({ success: true, summary: note.aiSummary });
    }

    let textToSummarize = note.extractedText;

    // If no extracted text, fetch and extract from PDF URL
    if (!textToSummarize) {
      if (!note.fileUrl) {
        return res.status(400).json({ success: false, message: 'No PDF file attached to this note' });
      }

      try {
        textToSummarize = await extractTextFromPDFUrl(note.fileUrl);
        note.extractedText = textToSummarize;
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to extract text from PDF' });
      }
    }

    // Generate summary
    const summary = await summarizeText(textToSummarize);

    // Cache summary and text
    note.aiSummary = summary;
    await note.save();

    return res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error(`Error in summarizeNote for noteId ${req.body?.noteId}:`, error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * @desc Chat with Note / PDF
 * @route POST /api/ai/chat-note
 */
exports.chatNote = async (req, res) => {
  try {
    const { noteId, prompt, history } = req.body;

    if (!noteId || !prompt) {
      return res.status(400).json({ success: false, message: 'Note ID and prompt are required' });
    }

    let note;
    try {
      note = await Note.findById(noteId);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid Note ID format' });
    }

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    let textContext = note.extractedText;

    // If text not cached, extract it
    if (!textContext) {
      if (!note.fileUrl) {
        return res.status(400).json({ success: false, message: 'No PDF file attached to this note' });
      }
      textContext = await extractTextFromPDFUrl(note.fileUrl);
      note.extractedText = textContext;
      await note.save();
    }

    const reply = await chatWithText(textContext, prompt, history || []);

    return res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error(`Error in chatNote for noteId ${req.body?.noteId}:`, error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal Server Error' 
    });
  }
};
