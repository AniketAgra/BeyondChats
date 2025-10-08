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
 * GET /api/ai-buddy/sessions
 * Get all chat sessions for the user
 */
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const { type } = req.query // 'pdf' or 'general' or undefined (all)
    const result = await getUserChatSessions(req.user._id, type)
    
    if (result.success) {
      res.json({ sessions: result.sessions })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/ai-buddy/sessions
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
 * GET /api/ai-buddy/sessions/:sessionId/messages
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
 * POST /api/ai-buddy/sessions/:sessionId/messages
 * Send a message in a session
 */
router.post('/sessions/:sessionId/messages', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { content, useRAG = true } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    const result = await sendMessageInSession(
      sessionId,
      req.user._id,
      content,
      useRAG
    )
    
    if (result.success) {
      res.status(201).json({ messages: result.messages })
    } else {
      res.status(404).json({ error: result.error })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * PATCH /api/ai-buddy/sessions/:sessionId
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
 * DELETE /api/ai-buddy/sessions/:sessionId
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
