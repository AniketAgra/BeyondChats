import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import {
  createChatSession,
  getUserChatSessions,
  getSessionMessages,
  sendMessageInSession,
  updateSessionTitle,
  deleteChatSession
} from '../services/aiStudyBuddy.service.js'

const router = Router()

/**
 * GET /api/aibuddy/sessions
 * Get all chat sessions for the user
 */
router.get('/sessions', requireAuth, async (req, res) => {
  console.log(`[AI Buddy Routes] GET /sessions - User: ${req.user._id}`)
  
  try {
    const { type } = req.query // 'pdf' or 'general' or undefined (all)
    console.log(`[AI Buddy Routes] Filtering by type: ${type || 'all'}`)
    
    const result = await getUserChatSessions(req.user._id, type)
    
    if (result.success) {
      console.log(`[AI Buddy Routes] ✅ Returning ${result.sessions.length} sessions`)
      res.json({ sessions: result.sessions })
    } else {
      console.error('[AI Buddy Routes] ❌ Failed to get sessions:', result.error)
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    console.error('[AI Buddy Routes] ❌ Exception in GET /sessions:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/aibuddy/sessions
 * Create a new chat session
 */
router.post('/sessions', requireAuth, async (req, res) => {
  try {
    const { type, pdfId, title } = req.body
    
    if (!type || !['pdf', 'general'].includes(type)) {
      return res.status(400).json({ error: 'Invalid session type' })
    }

    if (type === 'pdf' && !pdfId) {
      return res.status(400).json({ error: 'pdfId required for PDF chat' })
    }

    const result = await createChatSession(req.user._id, type, pdfId, title)
    
    if (result.success) {
      res.status(201).json({ session: result.session })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/aibuddy/sessions/pdf/:pdfId
 * Get or create a session for a specific PDF
 */
router.get('/sessions/pdf/:pdfId', requireAuth, async (req, res) => {
  try {
    const { pdfId } = req.params
    
    // First, try to find an existing session for this PDF
    const existingResult = await getUserChatSessions(req.user._id, 'pdf')
    
    if (existingResult.success) {
      const existingSession = existingResult.sessions.find(
        s => s.pdfId && s.pdfId._id.toString() === pdfId
      )
      
      if (existingSession) {
        return res.json({ session: existingSession, created: false })
      }
    }
    
    // If no existing session, create a new one
    const createResult = await createChatSession(req.user._id, 'pdf', pdfId)
    
    if (createResult.success) {
      res.status(201).json({ session: createResult.session, created: true })
    } else {
      res.status(500).json({ error: createResult.error })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/aibuddy/sessions/:sessionId/messages
 * Get all messages for a session
 */
router.get('/sessions/:sessionId/messages', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { limit = 50 } = req.query
    
    const result = await getSessionMessages(sessionId, parseInt(limit))
    
    if (result.success) {
      res.json({ messages: result.messages })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/aibuddy/sessions/:sessionId/messages
 * Send a message in a session
 */
router.post('/sessions/:sessionId/messages', requireAuth, async (req, res) => {
  console.log(`[AI Buddy Routes] POST /sessions/${req.params.sessionId}/messages`)
  console.log(`[AI Buddy Routes] User: ${req.user._id}`)
  
  try {
    const { sessionId } = req.params
    const { content, useRAG = true } = req.body
    
    console.log(`[AI Buddy Routes] Message content: "${content?.substring(0, 50)}..."`)
    console.log(`[AI Buddy Routes] useRAG: ${useRAG}`)
    
    if (!content || !content.trim()) {
      console.error('[AI Buddy Routes] ❌ Empty message content')
      return res.status(400).json({ error: 'Message content is required' })
    }

    const result = await sendMessageInSession(
      sessionId,
      req.user._id,
      content,
      useRAG
    )
    
    if (result.success) {
      console.log('[AI Buddy Routes] ✅ Message sent successfully')
      res.status(201).json({ messages: result.messages })
    } else {
      console.error('[AI Buddy Routes] ❌ Failed to send message:', result.error)
      res.status(404).json({ error: result.error })
    }
  } catch (error) {
    console.error('[AI Buddy Routes] ❌ Exception in POST /messages:', error)
    console.error('[AI Buddy Routes] Stack:', error.stack)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PATCH /api/aibuddy/sessions/:sessionId
 * Update session title
 */
router.patch('/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { title } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const result = await updateSessionTitle(sessionId, req.user._id, title)
    
    if (result.success) {
      res.json({ session: result.session })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/aibuddy/sessions/:sessionId
 * Delete (archive) a chat session
 */
router.delete('/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    
    const result = await deleteChatSession(sessionId, req.user._id)
    
    if (result.success) {
      res.json({ message: 'Session deleted successfully' })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
