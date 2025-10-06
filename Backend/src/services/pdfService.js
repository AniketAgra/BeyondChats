import pdfParse from 'pdf-parse';
import Summary from '../schemas/Summary.js';

export async function parsePdf(buffer) {
  const data = await pdfParse(buffer);
  return { text: data.text, numPages: data.numpages };
}

async function llmSummarize(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Mock summary in dev without key
    return text.slice(0, 800) + (text.length > 800 ? '…' : '');
  }
  const prompt = `Summarize the following study material into 5-8 bullet points with key topics and definitions.\n\n${text}`;
  // Lazy import to avoid dependency unless needed
  const { default: axios } = await import('axios');
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 400
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  return res.data.choices?.[0]?.message?.content || '';
}

export async function summarizePdf({ text, buffer, pdfId }) {
  let content = text;
  if (!content && buffer) {
    const parsed = await parsePdf(buffer);
    content = parsed.text;
  }
  if (!content) throw new Error('No text to summarize');

  // cache by pdfId if provided
  if (pdfId && Summary.findOne) {
    const cached = await Summary.findOne({ pdfId });
    if (cached) return { summary: cached.summary, cached: true };
  }
  const summary = await llmSummarize(content);

  if (pdfId && Summary.create) {
    await Summary.create({ pdfId, summary });
  }
  return { summary, cached: false };
}
