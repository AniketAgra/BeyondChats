/**
 * AI Study Buddy Service - Full RAG Implementation
 * Personalized AI mentor with access to all user data
 */

import { GoogleGenAI } from '@google/genai'
import { queryGeneralContext } from './vector.service.js'
import QuizAttempt from '../schemas/QuizAttempt.js'
import TopicPerformance from '../schemas/TopicPerformance.js'
import Pdf from '../schemas/Pdf.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

/**
 * Get user's performance summary
 */
async function getUserPerformance(userId) {
  console.log(`[AI Study Buddy] Fetching performance for user: ${userId}`)
  
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

    console.log(`[AI Study Buddy] Performance stats - Quizzes: ${totalQuizzes}, Avg: ${averageScore.toFixed(1)}%, Weak topics: ${weakTopics.length}`)

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
    console.error('[AI Study Buddy] Failed to get user performance:', error)
    return null
  }
}

/**
 * Build context for AI Study Buddy
 * Gathers ALL user data for comprehensive mentoring
 */
async function buildStudyBuddyContext(userId, question) {
  console.log(`[AI Study Buddy] Building context for question: "${question.substring(0, 50)}..."`)
  
  const context = {
    performance: null,
    ragMatches: [],
    userPDFs: []
  }

  try {
    // Get performance data (MongoDB)
    context.performance = await getUserPerformance(userId)

    // Get vector search results (Pinecone RAG - across ALL user data)
    console.log('[AI Study Buddy] Querying RAG for relevant context...')
    const ragResults = await queryGeneralContext(userId, question, 5)
    if (ragResults.success && ragResults.matches) {
      context.ragMatches = ragResults.matches
      console.log(`[AI Study Buddy] RAG returned ${ragResults.matches.length} relevant matches`)
    } else {
      console.log('[AI Study Buddy] No RAG matches found or RAG unavailable')
    }

    // Get user's PDF list (for awareness of available materials)
    const pdfs = await Pdf.find({ user: userId })
      .select('title author subject')
      .limit(10)
      .lean()
    context.userPDFs = pdfs
    console.log(`[AI Study Buddy] User has ${pdfs.length} PDFs available`)

    return context
  } catch (error) {
    console.error('[AI Study Buddy] Failed to build context:', error)
    return context
  }
}

/**
 * Generate AI Study Buddy response with full RAG
 * This is the MAIN AI tutor with access to ALL user data
 */
export async function generateStudyBuddyResponse({ userId, question, conversationHistory = [] }) {
  console.log(`[AI Study Buddy] ======= GENERATING RESPONSE =======`)
  console.log(`[AI Study Buddy] User: ${userId}`)
  console.log(`[AI Study Buddy] Question: "${question}"`)
  console.log(`[AI Study Buddy] History length: ${conversationHistory.length}`)
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('[AI Study Buddy] Missing GEMINI_API_KEY')
      return {
        success: false,
        response: "I'm not fully configured yet. Please add your Gemini API key to enable AI responses.",
        hasContext: false
      }
    }

    // Build comprehensive context from ALL sources
    console.log('[AI Study Buddy] Building comprehensive context...')
    const context = await buildStudyBuddyContext(userId, question)

    // Build system prompt
    let systemPrompt = `You are an AI Study Buddy - a personalized, supportive learning mentor with access to comprehensive student data.

## Student Context:

### 1. Performance Data:
${context.performance ? `
   - **Total Quizzes**: ${context.performance.totalQuizzes}
   - **Average Score**: ${context.performance.averageScore}%
   - **Weak Topics**: ${context.performance.weakTopics.join(', ') || 'None identified yet'}
   - **Recent Performance**: 
${context.performance.recentPerformance.map(p => `     • ${p.topic}: ${p.score}%`).join('\n')}
` : '   No quiz history available yet - guide them to take quizzes!'}

### 2. Study Materials:
${context.userPDFs.length > 0 ? `
   Available PDFs:
${context.userPDFs.map(p => `   • ${p.title}${p.author ? ` by ${p.author}` : ''}${p.subject ? ` (${p.subject})` : ''}`).join('\n')}
` : '   No PDFs uploaded yet - encourage them to upload study materials!'}

### 3. Relevant Content (RAG):
${context.ragMatches.length > 0 ? `
${context.ragMatches.map((m, i) => `
   **Match ${i + 1}** (${(m.score * 100).toFixed(1)}% relevance):
   ${m.type === 'performance' ? 'Performance Data' : 'Study Material'}
   Content: ${m.text || 'N/A'}
`).join('\n')}
` : '   No specific context retrieved for this query - answer from general knowledge.'}

## Your Role:
✅ **Be a Supportive Mentor**: Encourage, motivate, and build confidence
✅ **Personalize Advice**: Use their performance data to give targeted guidance
✅ **Explain Clearly**: Break down complex concepts with examples and analogies
✅ **Suggest Strategies**: Provide specific study techniques and action plans
✅ **Track Progress**: Reference their weak topics and recent improvements
✅ **Be Conversational**: Write naturally, as a friendly tutor would speak
✅ **Stay Relevant**: Base answers on their actual study materials when possible

## Response Guidelines:
- **Length**: 200-500 words (comprehensive but digestible)
- **Tone**: Encouraging, patient, enthusiastic
- **Structure**: Use clear sections, bullet points, and examples
- **Actionable**: Always include next steps or practice suggestions
- **Holistic**: Consider all their materials and performance together

## Remember:
- You're their MAIN AI tutor with access to ALL their study data
- You have memory across ALL sessions and materials
- Focus on long-term learning growth, not just quick answers
- Celebrate improvements and address challenges constructively`

    // Build conversation history for Gemini
    let conversationContext = ''
    if (conversationHistory.length > 0) {
      conversationContext = '\n\n**Previous Conversation:**\n'
      conversationHistory.slice(-8).forEach(msg => {
        conversationContext += `${msg.role === 'user' ? 'Student' : 'AI Study Buddy'}: ${msg.content}\n\n`
      })
    }

    const fullPrompt = `${systemPrompt}

${conversationContext}

**Student's Current Question**: ${question}

**Your Response** (200-500 words, personalized and encouraging):`

    // Call Gemini API
    console.log('[AI Study Buddy] Calling Gemini API...')
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: fullPrompt,
      config: {
        temperature: 0.7
      }
    })
    
    const aiResponse = response.text
    
    console.log(`[AI Study Buddy] ✅ Generated response (${aiResponse.length} chars)`)

    return {
      success: true,
      response: aiResponse,
      hasContext: context.ragMatches.length > 0 || context.performance !== null,
      context: {
        ragMatches: context.ragMatches.length,
        hasPerformance: context.performance !== null,
        weakTopics: context.performance?.weakTopics || []
      }
    }
  } catch (error) {
    console.error('[AI Study Buddy] ❌ Error generating response:', error)
    console.error('[AI Study Buddy] Error stack:', error.stack)
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
    // If it's a PDF session, get PDF details to populate metadata
    let pdfTitle = null
    let pdfMeta = {}
    if (type === 'pdf' && pdfId) {
      const pdf = await Pdf.findById(pdfId).select('title filename summary keyPoints extractedText content pages author').lean()
      if (pdf) {
        pdfTitle = pdf.title || pdf.filename
        pdfMeta = {
          pdfTitle: pdfTitle,
          sessionType: 'pdf-specific',
          pdfSummary: pdf.summary || null,
          pdfKeyPoints: pdf.keyPoints || [],
          pdfPages: pdf.pages || 0,
          pdfAuthor: pdf.author || null,
          hasContent: !!(pdf.extractedText || pdf.content)
        }
      }
    }

    const session = await ChatSession.create({
      user: userId,
      type,
      pdfId: type === 'pdf' ? pdfId : undefined,
      title: title || (type === 'pdf' ? (pdfTitle || 'PDF Chat') : 'New Chat'),
      lastMessageAt: new Date(),
      meta: type === 'pdf' ? pdfMeta : undefined
    })

    // Populate pdfId before returning
    const populatedSession = await ChatSession.findById(session._id)
      .populate('pdfId', 'title author filename summary keyPoints pages')
      .lean()

    return { success: true, session: populatedSession || session }
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
 * Routes to correct AI service based on session type
 */
export async function sendMessageInSession(sessionId, userId, content, useRAG = true) {
  console.log(`[Session Message] ======= NEW MESSAGE =======`)
  console.log(`[Session Message] Session: ${sessionId}`)
  console.log(`[Session Message] User: ${userId}`)
  console.log(`[Session Message] Content: "${content.substring(0, 100)}..."`)
  
  try {
    const session = await ChatSession.findOne({ _id: sessionId, user: userId })
    if (!session) {
      console.error('[Session Message] ❌ Session not found')
      return { success: false, error: 'Session not found' }
    }

    console.log(`[Session Message] Session type: ${session.type}`)
    if (session.type === 'pdf') {
      console.log(`[Session Message] PDF ID: ${session.pdfId}`)
      
      // Ensure we have the PDF metadata populated
      if (!session.meta || !session.meta.pdfSummary) {
        console.log('[Session Message] Populating PDF metadata...')
        const pdf = await Pdf.findById(session.pdfId).select('title summary keyPoints extractedText content pages author').lean()
        if (pdf) {
          session.meta = session.meta || {}
          session.meta.pdfTitle = pdf.title
          session.meta.pdfSummary = pdf.summary
          session.meta.pdfKeyPoints = pdf.keyPoints || []
          session.meta.pdfPages = pdf.pages || 0
          session.meta.pdfAuthor = pdf.author
          session.meta.hasContent = !!(pdf.extractedText || pdf.content)
          await session.save()
          console.log('[Session Message] ✅ PDF metadata updated')
        }
      }
    }

    // Save user message
    const userMessage = await SessionMessage.create({
      sessionId,
      user: userId,
      role: 'user',
      content
    })
    console.log('[Session Message] ✅ User message saved')

    // Get conversation history for context
    const recentMessages = await SessionMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()
    
    const conversationHistory = recentMessages.reverse()
    console.log(`[Session Message] Retrieved ${conversationHistory.length} messages for context`)

    // Generate AI response based on session type
    let aiResponseData
    
    if (session.type === 'pdf' && session.pdfId) {
      console.log('[Session Message] 📄 Using PDF Buddy service...')
      // Import PDF-specific service
      const { generatePDFBuddyResponse } = await import('./aiPdfBuddy.service.js')
      aiResponseData = await generatePDFBuddyResponse({
        userId,
        pdfId: session.pdfId,
        question: content,
        conversationHistory
      })
    } else {
      console.log('[Session Message] 🧠 Using General Study Buddy service...')
      // Use general Study Buddy for non-PDF sessions
      aiResponseData = await generateStudyBuddyResponse({
        userId,
        question: content,
        conversationHistory
      })
    }

    if (!aiResponseData || !aiResponseData.response) {
      console.error('[Session Message] ❌ AI service returned no response')
      throw new Error('AI service failed to generate response')
    }

    console.log(`[Session Message] ✅ AI response generated (${aiResponseData.response.length} chars)`)

    const aiMessage = await SessionMessage.create({
      sessionId,
      user: userId,
      role: 'ai',
      content: aiResponseData.response,
      meta: {
        aiGenerated: aiResponseData.success,
        hasContext: aiResponseData.hasContext || false,
        ragUsed: useRAG,
        pdfSpecific: session.type === 'pdf'
      }
    })
    console.log('[Session Message] ✅ AI message saved')

    // Update session
    session.lastMessageAt = new Date()
    session.messageCount += 2
    await session.save()
    console.log('[Session Message] ✅ Session updated')

    console.log('[Session Message] ======= MESSAGE COMPLETE =======')

    return {
      success: true,
      messages: [userMessage, aiMessage]
    }
  } catch (error) {
    console.error('[Session Message] ❌ Failed to send message:', error)
    console.error('[Session Message] Error stack:', error.stack)
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
