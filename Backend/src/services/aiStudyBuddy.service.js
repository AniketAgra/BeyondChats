/**
 * AI Study Buddy Service - Full RAG Implementation
 * Personalized AI mentor with access to all user data
 */

import OpenAI from 'openai'
import { queryGeneralContext } from './vector.service.js'
import QuizAttempt from '../schemas/QuizAttempt.js'
import TopicPerformance from '../schemas/TopicPerformance.js'
import Pdf from '../schemas/Pdf.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Get user's performance summary
 */
async function getUserPerformance(userId) {
  try {
    const quizAttempts = await QuizAttempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    const topicPerformance = await TopicPerformance.find({ user: userId })
      .sort({ accuracy: 1 })
      .limit(5)
      .lean()

    const totalQuizzes = quizAttempts.length
    const averageScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, q) => sum + (q.score || 0), 0) / totalQuizzes
      : 0

    const weakTopics = topicPerformance
      .filter(t => t.accuracy < 70)
      .map(t => t.topic)

    return {
      totalQuizzes,
      averageScore: averageScore.toFixed(1),
      weakTopics,
      recentPerformance: quizAttempts.slice(0, 3).map(q => ({
        topic: q.topic || 'General',
        score: q.score,
        date: q.createdAt
      }))
    }
  } catch (error) {
    console.error('Failed to get user performance:', error)
    return null
  }
}

/**
 * Build context for AI Study Buddy
 */
async function buildStudyBuddyContext(userId, question) {
  const context = {
    performance: null,
    ragMatches: [],
    userPDFs: []
  }

  try {
    // Get performance data
    context.performance = await getUserPerformance(userId)

    // Get vector search results (RAG)
    const ragResults = await queryGeneralContext(userId, question, 5)
    if (ragResults.success) {
      context.ragMatches = ragResults.matches
    }

    // Get user's PDF list
    const pdfs = await Pdf.find({ user: userId })
      .select('title author subject')
      .limit(10)
      .lean()
    context.userPDFs = pdfs

    return context
  } catch (error) {
    console.error('Failed to build context:', error)
    return context
  }
}

/**
 * Generate AI Study Buddy response with full RAG
 */
export async function generateStudyBuddyResponse({ userId, question, conversationHistory = [] }) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        response: "I'm not fully configured yet. Please add your OpenAI API key to enable AI responses.",
        hasContext: false
      }
    }

    // Build comprehensive context
    const context = await buildStudyBuddyContext(userId, question)

    // Build system prompt
    let systemPrompt = `You are an AI Study Buddy - a personalized learning mentor. You have access to:

1. **Student Performance**:
${context.performance ? `
   - Total Quizzes Taken: ${context.performance.totalQuizzes}
   - Average Score: ${context.performance.averageScore}%
   - Weak Topics: ${context.performance.weakTopics.join(', ') || 'None identified yet'}
   - Recent Performance: ${JSON.stringify(context.performance.recentPerformance)}
` : 'No quiz data available yet'}

2. **Student's Study Materials**:
${context.userPDFs.length > 0 ? `
   - PDFs: ${context.userPDFs.map(p => p.title).join(', ')}
` : 'No PDFs uploaded yet'}

3. **Relevant Context (RAG)**:
${context.ragMatches.length > 0 ? `
${context.ragMatches.map((m, i) => `
   Match ${i + 1} (${(m.score * 100).toFixed(1)}% relevant):
   ${JSON.stringify(m.metadata)}
`).join('\n')}
` : 'No specific context found for this query'}

**Your Role**:
- Act as a supportive, encouraging mentor
- Provide personalized guidance based on their performance
- Focus on weak areas and suggest improvement strategies
- Explain concepts clearly with examples
- Create study plans when requested
- Be conversational and friendly
- Keep responses comprehensive but digestible (aim for 200-400 words)

**Important**: 
- You are the AI Study Buddy, not a PDF-specific assistant
- You have memory of all their study activities across all materials
- Focus on overall learning growth and performance improvement`

    // Build messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: question }
    ]

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 800
    })

    const response = completion.choices[0].message.content

    return {
      success: true,
      response,
      hasContext: context.ragMatches.length > 0 || context.performance !== null,
      context: {
        ragMatches: context.ragMatches.length,
        hasPerformance: context.performance !== null,
        weakTopics: context.performance?.weakTopics || []
      }
    }
  } catch (error) {
    console.error('AI Study Buddy error:', error)
    return {
      success: false,
      response: "I'm having trouble processing that right now. Could you try rephrasing your question?",
      error: error.message
    }
  }
}

/**
 * Session Management Functions
 */

import ChatSession from '../schemas/ChatSession.js'
import SessionMessage from '../schemas/SessionMessage.js'

/**
 * Create a new chat session
 */
export async function createChatSession(userId, type, pdfId = null, title = null) {
  try {
    const session = await ChatSession.create({
      user: userId,
      type,
      pdfId: type === 'pdf' ? pdfId : undefined,
      title: title || (type === 'pdf' ? 'PDF Chat' : 'New Chat'),
      lastMessageAt: new Date()
    })

    return { success: true, session }
  } catch (error) {
    console.error('Failed to create chat session:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all chat sessions for a user
 */
export async function getUserChatSessions(userId, type = null) {
  try {
    const query = { user: userId, isActive: true }
    if (type) query.type = type

    const sessions = await ChatSession.find(query)
      .populate('pdfId', 'title author')
      .sort({ lastMessageAt: -1 })
      .lean()

    return { success: true, sessions }
  } catch (error) {
    console.error('Failed to get chat sessions:', error)
    return { success: false, sessions: [], error: error.message }
  }
}

/**
 * Get messages for a session
 */
export async function getSessionMessages(sessionId, limit = 50) {
  try {
    const messages = await SessionMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean()

    return { success: true, messages }
  } catch (error) {
    console.error('Failed to get session messages:', error)
    return { success: false, messages: [], error: error.message }
  }
}

/**
 * Send message in a chat session
 */
export async function sendMessageInSession(sessionId, userId, content, useRAG = true) {
  try {
    const session = await ChatSession.findOne({ _id: sessionId, user: userId })
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    // Save user message
    const userMessage = await SessionMessage.create({
      sessionId,
      user: userId,
      role: 'user',
      content
    })

    // Generate AI response
    const aiResponseData = await generateStudyBuddyResponse({
      userId,
      question: content,
      conversationHistory: []
    })

    const aiMessage = await SessionMessage.create({
      sessionId,
      user: userId,
      role: 'ai',
      content: aiResponseData.response || 'I apologize, but I could not generate a response.',
      meta: {
        aiGenerated: aiResponseData.success,
        hasContext: aiResponseData.hasContext || false,
        ragUsed: useRAG
      }
    })

    // Update session
    session.lastMessageAt = new Date()
    session.messageCount += 2
    await session.save()

    return {
      success: true,
      messages: [userMessage, aiMessage]
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update session title
 */
export async function updateSessionTitle(sessionId, userId, title) {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, user: userId },
      { title },
      { new: true }
    )

    return { success: true, session }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId, userId) {
  try {
    await ChatSession.findOneAndUpdate(
      { _id: sessionId, user: userId },
      { isActive: false }
    )

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export default {
  generateStudyBuddyResponse,
  getUserPerformance,
  buildStudyBuddyContext,
  createChatSession,
  getUserChatSessions,
  getSessionMessages,
  sendMessageInSession,
  updateSessionTitle,
  deleteChatSession
}
