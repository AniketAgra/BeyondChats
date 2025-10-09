import dotenv from 'dotenv'
dotenv.config()

// LLM Client Setup
async function createLlmClient() {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (provider === 'gemini' || provider === 'google') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    return {
      async generate({ model = 'gemini-2.0-flash-exp', prompt }) {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { temperature: 0.7 }
        });
        const text = res.text || '';
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
          { model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 3000 },
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

// Function to generate a topic name using AI from the content
async function generateTopicFromContent(text, client) {
  if (!client || !text) {
    return 'General';
  }
  
  try {
    const prompt = `Based on the following content, generate a concise topic name (2-5 words) that best describes the main subject or theme. 
Return ONLY the topic name, nothing else.

Content:
${text.substring(0, 1500)}

Topic name:`;

    const response = await client.generate({ prompt });
    const generatedTopic = response.text.trim()
      .replace(/^["']|["']$/g, '') // Remove quotes if any
      .replace(/\n.*/g, '') // Take only first line
      .substring(0, 100); // Limit length
    
    return generatedTopic || 'General';
  } catch (error) {
    console.error('Failed to generate topic:', error);
    return 'General';
  }
}

export async function generateQuiz({ text, pdfId, difficulty = 'medium', types = ['MCQ'], topic, count = 10, userId }) {
  const client = await getClient();
  
  if (!client || !text) {
    // Fallback to dummy data if no AI or text
    return generateDummyQuiz({ difficulty, types, topic, count });
  }

  try {
    // Generate topic from content if not provided
    let quizTopic = topic;
    if (!quizTopic && text) {
      quizTopic = await generateTopicFromContent(text, client);
      console.log('AI-generated topic:', quizTopic);
    }
    
    const questionsPerType = Math.ceil(count / types.length);
    const allQuestions = [];

    for (const type of types) {
      const prompt = buildPrompt(type, text, difficulty, quizTopic, questionsPerType);
      const response = await client.generate({ prompt });
      const questions = parseQuestions(response.text, type);
      allQuestions.push(...questions);
    }

    const finalQuestions = allQuestions.slice(0, count);

    return {
      difficulty,
      types,
      topic: quizTopic || 'General',
      questions: finalQuestions
    };
  } catch (error) {
    console.error('Quiz generation error:', error);
    return generateDummyQuiz({ difficulty, types, topic, count });
  }
}

function buildPrompt(type, text, difficulty, topic, count) {
  const difficultyInstructions = {
    easy: 'straightforward and basic concepts',
    medium: 'moderate complexity requiring understanding',
    hard: 'advanced and require deep analysis'
  };

  const basePrompt = `Generate ${count} ${difficulty} difficulty ${type} questions from the following text${topic ? ` focusing on: ${topic}` : ''}.

Text:
${text.substring(0, 3000)}

Requirements:
- Questions should be ${difficultyInstructions[difficulty]}
- Focus on key concepts, definitions, and important details
- Each question must have a clear, detailed explanation`;

  if (type === 'MCQ') {
    return `${basePrompt}
- Provide exactly 4 options (A, B, C, D) for each question
- Only one option should be correct
- Make distractors plausible but clearly wrong

Format each question as JSON:
{
  "question": "Question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answerIndex": 0,
  "explanation": "Detailed explanation of why this is correct"
}

Return a JSON array of questions.`;
  }

  if (type === 'SAQ') {
    return `${basePrompt}
- Questions should require 2-3 sentence answers
- Focus on definitions, explanations, and comparisons

Format each question as JSON:
{
  "question": "Question text?",
  "answer": "Correct answer (2-3 sentences)",
  "keywords": ["key", "terms", "expected"],
  "explanation": "What makes this a good answer"
}

Return a JSON array of questions.`;
  }

  if (type === 'LAQ') {
    return `${basePrompt}
- Questions should require detailed paragraph answers
- Focus on analysis, evaluation, and synthesis

Format each question as JSON:
{
  "question": "Question text?",
  "answer": "Comprehensive answer (5-7 sentences)",
  "keywords": ["key", "concepts", "to", "include"],
  "explanation": "Key points that should be covered"
}

Return a JSON array of questions.`;
  }

  return basePrompt;
}

function parseQuestions(responseText, type) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;
    
    const parsed = JSON.parse(jsonText);
    const questions = Array.isArray(parsed) ? parsed : [parsed];

    return questions.map((q, idx) => ({
      id: `q${Date.now()}_${idx}`,
      type,
      question: q.question || 'Question not available',
      ...(type === 'MCQ' && {
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        answerIndex: q.answerIndex ?? 0
      }),
      ...(type !== 'MCQ' && {
        answer: q.answer || '',
        keywords: q.keywords || []
      }),
      explanation: q.explanation || 'No explanation provided'
    }));
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return [];
  }
}

function generateDummyQuiz({ difficulty, types, topic, count }) {
  const questions = [];
  const questionsPerType = Math.ceil(count / types.length);

  types.forEach((type, typeIdx) => {
    for (let i = 0; i < questionsPerType && questions.length < count; i++) {
      const idx = questions.length;
      if (type === 'MCQ') {
        questions.push({
          id: `q${idx + 1}`,
          type: 'MCQ',
          question: `What is a key concept about ${topic || 'this topic'} (Question ${idx + 1})?`,
          options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
          answerIndex: idx % 4,
          explanation: `This is the correct answer because it aligns with the core principles discussed in the material.`
        });
      } else if (type === 'SAQ') {
        questions.push({
          id: `q${idx + 1}`,
          type: 'SAQ',
          question: `Briefly explain a key aspect of ${topic || 'this topic'} (Question ${idx + 1}).`,
          answer: `The key aspect involves understanding the fundamental principles and their practical applications in real-world scenarios.`,
          keywords: ['principles', 'applications', 'scenarios'],
          explanation: `A good answer should mention the core principles and provide specific examples.`
        });
      } else if (type === 'LAQ') {
        questions.push({
          id: `q${idx + 1}`,
          type: 'LAQ',
          question: `Discuss in detail the importance and implications of ${topic || 'this topic'} (Question ${idx + 1}).`,
          answer: `The topic is significant because it addresses fundamental challenges in the field. It has wide-ranging implications for both theoretical understanding and practical implementation. Key considerations include historical context, current applications, future trends, and ethical implications. A comprehensive understanding requires analyzing multiple perspectives and synthesizing diverse viewpoints.`,
          keywords: ['fundamental', 'implications', 'applications', 'perspectives', 'synthesis'],
          explanation: `A thorough answer should cover historical context, current state, future implications, and provide critical analysis.`
        });
      }
    }
  });

  return { difficulty, types, topic: topic || 'General', questions };
}

export async function submitQuiz({ questions, responses }) {
  let correct = 0;
  const results = [];

  questions.forEach((q, idx) => {
    const userAnswer = responses[idx];
    let isCorrect = false;
    let score = 0;

    if (q.type === 'MCQ') {
      isCorrect = userAnswer === q.answerIndex;
      score = isCorrect ? 1 : 0;
    } else if (q.type === 'SAQ' || q.type === 'LAQ') {
      // For text answers, calculate similarity score based on keywords
      score = calculateTextScore(userAnswer, q.answer, q.keywords);
      isCorrect = score >= 0.6; // 60% threshold
    }

    if (isCorrect) correct++;

    results.push({
      questionId: q.id,
      isCorrect,
      score: Math.round(score * 100),
      userAnswer,
      correctAnswer: q.type === 'MCQ' ? q.answerIndex : q.answer,
      explanation: q.explanation
    });
  });

  const totalScore = Math.round((correct / questions.length) * 100);

  return {
    score: totalScore,
    correct,
    total: questions.length,
    results
  };
}

function calculateTextScore(userAnswer, correctAnswer, keywords) {
  if (!userAnswer || typeof userAnswer !== 'string') return 0;
  
  const userLower = userAnswer.toLowerCase();
  const correctLower = correctAnswer.toLowerCase();
  
  // Check keyword presence (40% weight)
  let keywordScore = 0;
  if (keywords && keywords.length > 0) {
    const matchedKeywords = keywords.filter(kw => 
      userLower.includes(kw.toLowerCase())
    );
    keywordScore = matchedKeywords.length / keywords.length;
  }
  
  // Check length appropriateness (20% weight)
  const lengthRatio = Math.min(userAnswer.length / correctAnswer.length, 1);
  const lengthScore = lengthRatio > 0.3 ? 1 : lengthRatio / 0.3;
  
  // Check for common words (40% weight)
  const correctWords = correctLower.split(/\s+/).filter(w => w.length > 3);
  const userWords = userLower.split(/\s+/).filter(w => w.length > 3);
  const commonWords = userWords.filter(w => correctWords.includes(w));
  const wordScore = correctWords.length > 0 ? commonWords.length / correctWords.length : 0;
  
  return (keywordScore * 0.4) + (lengthScore * 0.2) + (wordScore * 0.4);
}
