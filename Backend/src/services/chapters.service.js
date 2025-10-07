import dotenv from 'dotenv'
dotenv.config()

// Minimal LLM client wrapper. Supports Gemini (Google Generative AI) or OpenAI Chat as backends.
async function createLlmClient() {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (provider === 'gemini' || provider === 'google') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;
    // dynamic import to avoid hard dependency if not used
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    return {
      async generate({ model = 'gemini-2.0-flash', prompt }) {
        const m = genAI.getGenerativeModel({ model });
        const res = await m.generateContent(prompt);
        const text = res.response?.text?.() || res.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text };
      }
    }
  }
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    const { default: axios } = await import('axios');
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    return {
      async generate({ prompt }) {
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          { model, messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 800 },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        const text = res.data?.choices?.[0]?.message?.content || '';
        return { text };
      }
    }
  }
  return null; // No provider configured
}

let llmClientPromise;
async function getClient() {
  if (!llmClientPromise) llmClientPromise = createLlmClient();
  return llmClientPromise;
}

export async function generateChaptersFromText(text) {
  const prompt = `
You are an AI assistant that analyzes coursebook PDFs.
Based on the following content, extract a structured list of chapter names
as they would appear in the Table of Contents.
Only return a JSON array of strings, nothing else.

Example:
["Physical World", "Units and Measurements", "Motion in a Straight Line"]

PDF Content:
${(text || '').slice(0, 8000)}
`;

  const client = await getClient();
  if (!client) {
    // Dev fallback
    return ['Introduction', 'Chapter 1', 'Chapter 2'];
  }
  const response = await client.generate({ model: 'gemini-2.0-flash', prompt });
  try {
    const output = JSON.parse(response.text || '[]');
    if (Array.isArray(output)) return output;
  } catch {}
  return ['Chapter 1', 'Chapter 2', 'Chapter 3'];
}

export async function generateSummary(text) {
  const prompt = `
Summarize the following PDF into 2-3 concise paragraphs for a student audience.
Avoid bullet points. Keep it objective and cover the main themes, definitions, and outcomes.

Content:
${(text || '').slice(0, 9000)}
`;
  const client = await getClient();
  if (!client) {
    // Dev fallback summary - return full text without truncation
    const t = (text || '').slice(0, 600);
    return t || 'Summary unavailable.';
  }
  const response = await client.generate({ model: 'gemini-2.0-flash', prompt });
  return response.text || 'Summary unavailable.';
}

export async function generateKeyPoints(text) {
  const prompt = `
You are an AI assistant that analyzes PDF documents and extracts key points.
Based on the following content, identify and extract the most important key topics, concepts, or highlights.

Instructions:
- Generate between 1-20 key points depending on the content richness and complexity
- For simple or short content, generate 1-5 points
- For moderate content, generate 6-11 points
- For comprehensive content, generate 12-20 points
- Each point should be one clear, concise sentence or phrase
- Focus on the MOST important and unique information
- Return ONLY a JSON array of strings, nothing else

Example:
["Newton's laws of motion describe the relationship between forces and motion", "Kinetic energy is proportional to mass and velocity squared", "Conservation of momentum applies in closed systems"]

PDF Content:
${(text || '').slice(0, 9000)}
`;

  const client = await getClient();
  if (!client) {
    // Dev fallback key points - extract from text
    const lines = (text || '').split('\n').filter(l => l.trim().length > 20 && l.trim().length < 150);
    const points = lines.slice(0, Math.min(8, Math.max(2, Math.floor(lines.length / 20)))).map(l => l.trim());
    return points.length > 0 ? points : ['Key concepts from the document'];
  }
  const response = await client.generate({ model: 'gemini-1.5-flash', prompt });
  try {
    const output = JSON.parse(response.text || '[]');
    if (Array.isArray(output) && output.length > 0) return output;
  } catch {}
  // Fallback if parsing fails - try to extract from text
  const lines = (text || '').split('\n').filter(l => l.trim().length > 20 && l.trim().length < 150);
  const points = lines.slice(0, Math.min(5, Math.max(2, Math.floor(lines.length / 20)))).map(l => l.trim());
  return points.length > 0 ? points : ['Unable to extract key points from document'];
}

export default {
  generateChaptersFromText,
  generateSummary,
  generateKeyPoints,
}
