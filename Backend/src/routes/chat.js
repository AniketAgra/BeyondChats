import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import ChatMessage from '../schemas/ChatMessage.js'
import { generateResponse } from '../services/pdfAssistent.service.js'

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

// Send a message -> AI buddy response (REST API fallback)
// Note: For real-time streaming, clients should use Socket.io
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { content, pdfId, conversationHistory = [] } = req.body
    if (!content) return res.status(400).json({ error: 'Missing content' })
    
    const userMsg = await ChatMessage.create({ user: req.user._id, role: 'user', content, pdfId })
    
    // Use AI service for intelligent responses with memory
    const result = await generateResponse({
      question: content,
      pdfId,
      conversationHistory,
      userId: req.user._id  // Pass userId for memory integration
    })
    
    let aiContent
    if (result.success) {
      aiContent = result.response
    } else {
      aiContent = result.fallback || generateAIResponse(content, pdfId)
    }
    
    const aiMsg = await ChatMessage.create({ 
      user: req.user._id, 
      role: 'ai', 
      content: aiContent, 
      pdfId,
      meta: {
        hasContext: result.hasContext,
        aiGenerated: result.success,
        memoryUsed: result.memoryUsed || false
      }
    })
    
    res.status(201).json({ messages: [userMsg, aiMsg] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Helper function to generate contextual AI responses (fallback)
function generateAIResponse(question, pdfId) {
  const q = question.toLowerCase()
  
  // Greeting responses
  if (q.match(/^(hi|hello|hey|greetings)/)) {
    return "Hello! 👋 I'm your AI Pdf Buddy. I'm here to help you understand this document better. Feel free to ask me anything - whether it's about specific concepts, summaries, or clarifications!"
  }
  
  // Summary requests
  if (q.includes('summarize') || q.includes('summary') || q.includes('key points')) {
    return "I'd be happy to help summarize the content! 📝 While I'm currently being set up with advanced AI capabilities, I can guide you:\n\n• Check the Key Features section for main points\n• Review the chapter summaries if available\n• Ask me about specific sections you'd like explained\n\nWhat specific part would you like me to focus on?"
  }
  
  // Explanation requests
  if (q.includes('explain') || q.includes('what is') || q.includes('what are') || q.includes('how does')) {
    return "Great question! 💡 I'm here to help explain concepts in simple terms. To give you the best explanation:\n\n• Could you point me to the specific page or section?\n• Is there a particular term or concept you'd like clarified?\n• Would you like a simple overview or detailed explanation?\n\nThe more specific you are, the better I can help!"
  }
  
  // Understanding help
  if (q.includes('understand') || q.includes('confused') || q.includes('don\'t get')) {
    return "I'm here to help you understand better! 🤔 Let's break it down together:\n\n• Which specific part is unclear?\n• Would examples help clarify the concept?\n• Should we go through it step by step?\n\nLearning is a journey, and asking questions is the best way forward!"
  }
  
  // Main takeaways
  if (q.includes('takeaway') || q.includes('main point') || q.includes('most important')) {
    return "Excellent question! 🎯 Understanding the main takeaways is crucial. Here's what I suggest:\n\n• Focus on the chapter introductions and conclusions\n• Look for repeated concepts or emphasized terms\n• Review the key features summary\n\nWhat specific topic or chapter should we focus on for the main points?"
  }
  
  // Study help
  if (q.includes('study') || q.includes('learn') || q.includes('prepare')) {
    return "I'm here to be your study partner! 📚 Here are some ways I can help:\n\n• Quiz yourself with the Quiz feature\n• Review weak topics identified in your dashboard\n• Take notes on key concepts\n• Ask me specific questions about the material\n\nWhat would you like to work on today?"
  }
  
  // Thanks
  if (q.match(/^(thanks|thank you|appreciate)/)) {
    return "You're very welcome! 😊 I'm always here to help you learn. Feel free to ask anything else!"
  }
  
  // Default helpful response
  return `I'm your AI Pdf Buddy, and I'm here to help! 🤖\n\nTo give you the best assistance:\n• Try to be specific about what you need help with\n• Reference particular sections or concepts\n• Let me know if you want summaries, explanations, or clarifications\n\nFor now, you can:\n✓ Use the Quiz feature to test your knowledge\n✓ Check Key Features for main points\n✓ Review your Dashboard for progress tracking\n\nWhat specific question can I help you with?`
}

export default router
