// NOTE: Import from the library file directly to avoid an upstream index.js
// behavior that tries to read a non-existent test PDF on import in some setups.
// Ref: ENOENT .../test/data/05-versions-space.pdf
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mongoose from 'mongoose';
import Pdf from '../schemas/Pdf.js';
import Summary from '../schemas/Summary.js';

export async function parsePdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return { text: data.text, numPages: data.numpages };
  } catch (err) {
    // Fallback: use pdfjs to at least determine page count and get minimal text
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
      const loadingTask = pdfjs.getDocument({ data: buffer });
      const doc = await loadingTask.promise;
      const numPages = doc.numPages;
      let text = '';
      // Extract first couple of pages to keep it fast if full extraction fails
      const maxPages = Math.min(numPages, 5);
      for (let i = 1; i <= maxPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(' ') + '\n';
      }
      return { text, numPages };
    } catch (fallbackErr) {
      // Re-throw original for clarity if both fail
      throw err;
    }
  }
}

async function llmSummarize(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const maxInput = Number(process.env.SUMMARIZE_MAX_CHARS || 12000);
  
  // Clean and normalize the input text
  const cleanText = (text || '')
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim()
    .slice(0, maxInput);

  // Return cleaned text without truncation
  const fallback = () => {
    if (!cleanText) return 'Summary unavailable.';
    
    // Create a basic structured summary from the text
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyPoints = sentences.slice(0, 8).map(s => s.trim());
    return keyPoints.join('.\n\n') + (keyPoints.length > 0 ? '.' : '');
  };

  if (!apiKey) {
    // Mock summary in dev without key - return structured content
    return fallback();
  }
  
  const prompt = `Summarize the following study material. Provide a clear, well-structured summary with:
- Main topic and key concepts
- Important definitions and terminology
- Key points explained in complete sentences
- Use proper paragraph formatting

Format your response in clear paragraphs with proper spacing. Do NOT use bullet points or special characters.

Content:
${cleanText}`;

  // Lazy import to avoid dependency unless needed
  try {
    const { default: axios } = await import('axios');
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );
    
    const rawSummary = res.data.choices?.[0]?.message?.content;
    if (!rawSummary) return fallback();
    
    // Clean up the summary text
    const cleanedSummary = rawSummary
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italics
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points at start of lines
      .trim();
    
    return cleanedSummary;
  } catch (err) {
    // Degrade gracefully if API fails
    return fallback();
  }
}

export async function summarizePdf({ userId, text, buffer, pdfId }) {
  let content = text;
  if (!content && buffer) {
    const parsed = await parsePdf(buffer);
    content = parsed.text;
  }
  // If pdfId provided and still no content, try fetching the PDF file from its URL
  if (!content && pdfId) {
    try {
  const doc = await Pdf.findOne({ _id: pdfId, user: userId }).lean();
      const url = doc?.url;
      if (url) {
        const { default: axios } = await import('axios');
        const resp = await axios.get(url, { responseType: 'arraybuffer' });
        const parsed = await parsePdf(Buffer.from(resp.data));
        content = parsed.text;
      }
    } catch (e) {
      // ignore and continue to error below if still no content
    }
  }
  if (!content) throw new Error('No text to summarize');

  // Helper: check DB connectivity (1 = connected)
  const isDbConnected = () => {
    try {
      return mongoose?.connection?.readyState === 1;
    } catch {
      return false;
    }
  };

  // cache by pdfId if provided and DB is available
  if (userId && pdfId && isDbConnected()) {
    try {
      const cached = await Summary.findOne({ user: userId, pdfId }).lean();
      if (cached) return { summary: cached.summary, cached: true };
    } catch (e) {
      // Ignore DB errors in mock/no-DB mode
    }
  }
  const summary = await llmSummarize(content);

  if (userId && pdfId && isDbConnected()) {
    try {
      // Upsert to avoid duplicate key errors on unique pdfId
      await Summary.updateOne(
        { user: userId, pdfId },
        { $set: { user: userId, pdfId, summary } },
        { upsert: true }
      );
    } catch (e) {
      // Swallow DB errors when operating without a DB
    }
  }
  return { summary, cached: false };
}
