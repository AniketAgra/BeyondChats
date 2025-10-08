import dotenv from 'dotenv'
dotenv.config()

// LLM Client Setup (reusing from chapters.service.js pattern)
async function createLlmClient() {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (provider === 'gemini' || provider === 'google') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;
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
          { model, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 1500 },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        const text = res.data?.choices?.[0]?.message?.content || '';
        return { text };
      }
    }
  }
  return null;
}

let llmClientPromise;
async function getClient() {
  if (!llmClientPromise) llmClientPromise = createLlmClient();
  return llmClientPromise;
}

/**
 * Generate known topics from PDF content
 * Returns a hierarchical structure: { mainTopic: "React JS", subtopics: ["Hooks", "State Management"] }
 */
export async function generateTopicsFromText(text, pdfTitle = '') {
  const prompt = `
You are an AI assistant that analyzes educational PDF documents and identifies the main subject/topic and its key subtopics.

Instructions:
- Identify ONE main overarching topic/subject (e.g., "React JS", "Machine Learning", "Organic Chemistry")
- List 3-15 important subtopics that are covered in the content
- Use standard, well-known terminology from the field
- Be specific but concise
- Return ONLY a JSON object in this exact format:

{
  "mainTopic": "Main Subject Name",
  "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
}

PDF Title: ${pdfTitle}

PDF Content:
${(text || '').slice(0, 10000)}
`;

  const client = await getClient();
  if (!client) {
    // Dev fallback - extract from title or content
    const fallbackTopic = pdfTitle || 'General Knowledge';
    return {
      mainTopic: fallbackTopic,
      subtopics: ['Introduction', 'Key Concepts', 'Advanced Topics']
    };
  }

  try {
    const response = await client.generate({ model: 'gemini-2.0-flash', prompt });
    const output = JSON.parse(response.text || '{}');
    
    if (output.mainTopic && Array.isArray(output.subtopics)) {
      return {
        mainTopic: output.mainTopic,
        subtopics: output.subtopics
      };
    }
  } catch (error) {
    console.error('Failed to parse topic generation response:', error);
  }

  // Fallback
  const fallbackTopic = pdfTitle || 'General Knowledge';
  return {
    mainTopic: fallbackTopic,
    subtopics: ['Introduction', 'Key Concepts', 'Advanced Topics']
  };
}

/**
 * Generate topics for a specific quiz question based on the question content and available topics
 */
export async function generateQuestionTopics(questionText, availableTopics = []) {
  if (availableTopics.length === 0) {
    return ['General'];
  }

  const prompt = `
You are an AI assistant that categorizes quiz questions into relevant topics.

Available Topics: ${availableTopics.join(', ')}

Question: ${questionText}

Instructions:
- Select 1-3 most relevant topics from the available topics that this question relates to
- If the question spans multiple topics, list them
- Return ONLY a JSON array of topic strings

Example: ["Hooks", "State Management"]
`;

  const client = await getClient();
  if (!client) {
    // Simple fallback - return first topic
    return [availableTopics[0] || 'General'];
  }

  try {
    const response = await client.generate({ model: 'gemini-2.0-flash', prompt });
    const output = JSON.parse(response.text || '[]');
    
    if (Array.isArray(output) && output.length > 0) {
      // Filter to only include topics that exist in availableTopics
      const validTopics = output.filter(t => 
        availableTopics.some(at => at.toLowerCase() === t.toLowerCase())
      );
      return validTopics.length > 0 ? validTopics : [availableTopics[0] || 'General'];
    }
  } catch (error) {
    console.error('Failed to parse question topics:', error);
  }

  // Fallback - return first available topic
  return [availableTopics[0] || 'General'];
}

/**
 * Batch generate topics for multiple questions
 */
export async function generateQuestionsTopicsBatch(questions, availableTopics = []) {
  if (availableTopics.length === 0) {
    return questions.map(() => ['General']);
  }

  const questionsText = questions.map((q, idx) => `${idx + 1}. ${q.question}`).join('\n');

  const prompt = `
You are an AI assistant that categorizes quiz questions into relevant topics.

Available Topics: ${availableTopics.join(', ')}

Questions:
${questionsText}

Instructions:
- For each question, select 1-3 most relevant topics from the available topics
- Return ONLY a JSON array where each element is an array of topics for that question
- The array length must match the number of questions (${questions.length})

Example format: [["Topic1"], ["Topic2", "Topic3"], ["Topic1"]]
`;

  const client = await getClient();
  if (!client) {
    // Fallback - assign first topic to all
    return questions.map(() => [availableTopics[0] || 'General']);
  }

  try {
    const response = await client.generate({ model: 'gemini-2.0-flash', prompt });
    const output = JSON.parse(response.text || '[]');
    
    if (Array.isArray(output) && output.length === questions.length) {
      return output.map(topicArray => {
        if (!Array.isArray(topicArray) || topicArray.length === 0) {
          return [availableTopics[0] || 'General'];
        }
        // Filter to only include valid topics
        const validTopics = topicArray.filter(t => 
          availableTopics.some(at => at.toLowerCase() === t.toLowerCase())
        );
        return validTopics.length > 0 ? validTopics : [availableTopics[0] || 'General'];
      });
    }
  } catch (error) {
    console.error('Failed to parse batch question topics:', error);
  }

  // Fallback - assign first topic to all
  return questions.map(() => [availableTopics[0] || 'General']);
}

export default {
  generateTopicsFromText,
  generateQuestionTopics,
  generateQuestionsTopicsBatch
}
