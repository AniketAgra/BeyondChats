/**
 * AI Buddy Predefined Triggers - Usage Examples
 * 
 * This file demonstrates how to use the AI Buddy predefined response system
 */

// ============================================
// EXAMPLE 1: Basic Usage in Chat Route
// ============================================

import express from 'express'
import { generateResponse, generateStreamingResponse } from '../services/pdfAssistant.service.js'

const router = express.Router()

// REST API endpoint (non-streaming)
router.post('/chat/send', async (req, res) => {
  const { message, pdfId, conversationHistory } = req.body
  
  const result = await generateResponse({
    question: message,
    pdfId,
    conversationHistory
  })
  
  // Check if it's a predefined redirect response
  if (result.redirectToTeacher) {
    return res.json({
      success: true,
      message: result.response,
      type: result.responseType, // 'predefined' or 'legacy'
      triggerId: result.triggerId, // e.g., 'DETAILED_QUERY'
      action: 'redirect_to_teacher'
    })
  }
  
  // Normal AI response
  res.json({
    success: true,
    message: result.response,
    wasTrimmed: result.wasTrimmed
  })
})

// ============================================
// EXAMPLE 2: WebSocket Integration (Streaming)
// ============================================

import { Server } from 'socket.io'

const io = new Server(server)

io.on('connection', (socket) => {
  socket.on('ai-buddy-message', async (data) => {
    const { message, pdfId, conversationHistory } = data
    
    // Use streaming response
    const result = await generateStreamingResponse({
      question: message,
      pdfId,
      conversationHistory,
      onChunk: (chunk) => {
        // Send each chunk to frontend as it's generated
        socket.emit('ai-buddy-chunk', { chunk })
      }
    })
    
    // Send final result with metadata
    socket.emit('ai-buddy-complete', {
      success: result.success,
      isRedirect: result.redirectToTeacher,
      responseType: result.responseType,
      triggerId: result.triggerId,
      fullResponse: result.response
    })
  })
})

// ============================================
// EXAMPLE 3: Testing Specific Triggers
// ============================================

import { checkPredefinedResponse } from '../config/aiBuddyResponses.js'

// Test various user queries
const testQueries = [
  "Explain Newton's laws in detail",
  "Give me a full summary",
  "How can I improve my scores?",
  "Teach me about calculus"
]

testQueries.forEach(query => {
  const result = checkPredefinedResponse(query)
  
  if (result) {
    console.log(`✅ Triggered: ${result.id}`)
    console.log(`📝 Response: ${result.response.substring(0, 100)}...`)
  } else {
    console.log(`❌ No trigger for: "${query}"`)
  }
})

// ============================================
// EXAMPLE 4: Custom Integration with Analytics
// ============================================

async function handleAiBuddyMessage(userId, message, pdfId) {
  // Check for predefined response first
  const predefined = checkPredefinedResponse(message)
  
  if (predefined) {
    // Log analytics
    await logEvent({
      event: 'ai_buddy_redirect',
      userId,
      triggerId: predefined.id,
      query: message,
      timestamp: new Date()
    })
    
    return {
      response: predefined.response,
      shouldRedirect: true,
      triggerId: predefined.id
    }
  }
  
  // Normal AI generation
  const result = await generateResponse({ question: message, pdfId })
  
  return {
    response: result.response,
    shouldRedirect: false
  }
}

// ============================================
// EXAMPLE 5: Frontend Integration (React)
// ============================================

// In your React component:
/*
const handleSendMessage = async (message) => {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message, pdfId }),
    headers: { 'Content-Type': 'application/json' }
  })
  
  const data = await response.json()
  
  // Check if it's a redirect response
  if (data.action === 'redirect_to_teacher') {
    // Highlight the AI Teacher icon
    setHighlightTeacherIcon(true)
    
    // Show the redirect message
    addMessage({ 
      text: data.message, 
      type: 'redirect',
      triggerId: data.triggerId 
    })
    
    // Optional: Show a button to open AI Teacher
    setShowTeacherButton(true)
    
    // Track analytics
    trackEvent('ai_buddy_redirect_shown', { triggerId: data.triggerId })
  } else {
    // Normal message
    addMessage({ text: data.message, type: 'response' })
  }
}
*/

// ============================================
// EXAMPLE 6: Adding New Trigger Categories
// ============================================

// In aiBuddyResponses.js, add a new category:
/*
{
  id: "PRACTICE_REQUEST",
  triggers: [
    "give me practice questions",
    "practice problems",
    "test myself",
    "quiz me on",
    "exercises on"
  ],
  response: `Want to practice? 📝
  
I recommend taking a quiz to test your knowledge!

Click the **Quiz** section to:
✨ Test your understanding
✨ Get instant feedback
✨ Track your progress
✨ Identify weak areas

Or visit your **AI Teacher** for guided practice sessions!`
}
*/

// ============================================
// EXAMPLE 7: Conditional Redirect Logic
// ============================================

async function smartAiBuddyResponse(message, userContext) {
  const predefined = checkPredefinedResponse(message)
  
  // If user has asked many questions already, be less aggressive
  if (predefined && userContext.messageCount > 10) {
    // Maybe skip the redirect and answer directly
    console.log('User is engaged, answering directly instead of redirect')
    return await generateResponse({ question: message })
  }
  
  // If it's the first detailed question, show redirect
  if (predefined && userContext.messageCount <= 3) {
    return {
      response: predefined.response,
      redirectToTeacher: true
    }
  }
  
  // Default behavior
  return await generateResponse({ question: message })
}

// ============================================
// EXAMPLE 8: A/B Testing Different Messages
// ============================================

function getResponseWithVariant(triggerId) {
  const variants = {
    'DETAILED_QUERY': [
      { 
        variant: 'A', 
        response: 'Short version: Visit AI Teacher for details!' 
      },
      { 
        variant: 'B', 
        response: 'Full version with emojis and detailed explanation' 
      }
    ]
  }
  
  // Randomly select variant for A/B testing
  const options = variants[triggerId]
  const selected = options[Math.random() < 0.5 ? 0 : 1]
  
  // Track which variant was shown
  logABTest({ triggerId, variant: selected.variant })
  
  return selected.response
}

// ============================================
// EXAMPLE 9: Rate Limiting Redirects
// ============================================

const userRedirectCounts = new Map()

function shouldShowRedirect(userId, triggerId) {
  const key = `${userId}-${triggerId}`
  const count = userRedirectCounts.get(key) || 0
  
  // Only show redirect up to 2 times per category per user
  if (count >= 2) {
    return false
  }
  
  userRedirectCounts.set(key, count + 1)
  return true
}

async function handleMessageWithRateLimit(userId, message) {
  const predefined = checkPredefinedResponse(message)
  
  if (predefined && shouldShowRedirect(userId, predefined.id)) {
    return {
      response: predefined.response,
      redirectToTeacher: true
    }
  }
  
  // Generate normal response if redirect quota exceeded
  return await generateResponse({ question: message })
}

// ============================================
// EXAMPLE 10: Middleware for Auto-Detection
// ============================================

// Express middleware to auto-detect and handle redirects
const aiBuddyMiddleware = (req, res, next) => {
  const { message } = req.body
  
  const predefined = checkPredefinedResponse(message)
  
  if (predefined) {
    // Attach predefined response to request object
    req.predefinedResponse = {
      response: predefined.response,
      triggerId: predefined.id,
      isRedirect: true
    }
  }
  
  next()
}

// Use in routes
router.post('/chat/send', aiBuddyMiddleware, async (req, res) => {
  // Check if middleware detected a predefined response
  if (req.predefinedResponse) {
    return res.json(req.predefinedResponse)
  }
  
  // Normal AI processing
  const result = await generateResponse({ 
    question: req.body.message 
  })
  
  res.json(result)
})

export {
  handleAiBuddyMessage,
  smartAiBuddyResponse,
  handleMessageWithRateLimit,
  aiBuddyMiddleware
}
