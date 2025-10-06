import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import ChatMessage from '../schemas/ChatMessage.js'

const router = Router()

// Get recent chat history (optionally scoped by pdfId)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { pdfId, limit = 50 } = req.query
    const q = { user: req.user._id }
    if (pdfId) q.pdfId = pdfId
    const items = await ChatMessage.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean()
    res.json({ items: items.reverse() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Send a message -> simple echo AI reply placeholder
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { content, pdfId } = req.body
    if (!content) return res.status(400).json({ error: 'Missing content' })
    const userMsg = await ChatMessage.create({ user: req.user._id, role: 'user', content, pdfId })
    // TODO: integrate actual LLM; for now echo stub
    const aiContent = `Aurora: I received your question${pdfId ? ' about this PDF' : ''}.`
    const aiMsg = await ChatMessage.create({ user: req.user._id, role: 'ai', content: aiContent, pdfId })
    res.status(201).json({ messages: [userMsg, aiMsg] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
