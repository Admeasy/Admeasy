const { Groq } = require('groq-sdk');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL_PRIMARY = 'llama-3.3-70b-versatile';
const MODEL_FALLBACK = 'llama-3.1-8b-instant';

/**
 * Extract text from a PDF URL.
 * It downloads the PDF into a buffer and uses pdf-parse to extract text.
 */
async function extractTextFromPDFUrl(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    // Parse at most the first 30 pages to handle huge PDFs efficiently
    const data = await pdfParse(buffer, { max: 30 });
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Limit the text size for the prompt.
 * We'll take roughly the first 25000 characters if it's too large to fit in context.
 */
function limitText(text, limit = 25000) {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '\n...[Text truncated]' : text;
}

/**
 * Summarize PDF text using Groq
 */
async function summarizeText(text) {
  if (!text || text.trim().length < 10) {
    return 'Text is too short to summarize.';
  }

  const prompt = `You are an academic assistant.
Summarize this PDF for students in clean sections:
1. Quick Overview
2. Key Points
3. Important Topics
4. Exam Focus Areas

Use markdown formatting. Make it concise and easy to read.

PDF Content:
${limitText(text)}`;

  // Try with Primary Model first
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL_PRIMARY,
      temperature: 0.3,
    });
    return chatCompletion.choices[0]?.message?.content || 'Summary could not be generated.';
  } catch (error) {
    console.warn(`Primary model (${MODEL_PRIMARY}) failed, trying fallback. Error:`, error.message);
    
    // Fallback to smaller, faster model
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL_FALLBACK,
        temperature: 0.3,
      });
      return chatCompletion.choices[0]?.message?.content || 'Summary could not be generated.';
    } catch (fallbackError) {
      console.error('Groq summarization error (both models failed):', fallbackError);
      throw new Error('AI service is currently busy or unavailable. Please try again in a few moments.');
    }
  }
}

/**
 * Chat with PDF text using Groq
 */
async function chatWithText(text, prompt, history = []) {
  const systemPrompt = `You are a helpful academic assistant.
Use ONLY the provided PDF content to answer.
If answer is not present, clearly say it is not found in the PDF.

PDF Content Context:
${limitText(text)}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: prompt },
  ];

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: MODEL_PRIMARY,
      temperature: 0.2,
    });
    return chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.warn(`Chat primary model failed, trying fallback. Error:`, error.message);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: messages,
        model: MODEL_FALLBACK,
        temperature: 0.2,
      });
      return chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (fallbackError) {
      console.error('Groq chat error (both models failed):', fallbackError);
      throw new Error('AI Chat is currently unavailable. Please try again later.');
    }
  }
}

module.exports = {
  extractTextFromPDFUrl,
  summarizeText,
  chatWithText,
};
