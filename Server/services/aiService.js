const { Groq } = require('groq-sdk');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';

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
  const prompt = `You are an academic assistant.
Summarize this PDF for students in clean sections:
1. Quick Overview
2. Key Points
3. Important Topics
4. Exam Focus Areas

Use markdown formatting. Make it concise and easy to read.

PDF Content:
${limitText(text)}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.3,
    });
    return chatCompletion.choices[0]?.message?.content || 'Summary could not be generated.';
  } catch (error) {
    console.error('Groq summarization error:', error);
    throw new Error('Failed to generate summary from AI');
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
      model: MODEL,
      temperature: 0.2,
    });
    return chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Groq chat error:', error);
    throw new Error('Failed to generate chat response from AI');
  }
}

module.exports = {
  extractTextFromPDFUrl,
  summarizeText,
  chatWithText,
};
