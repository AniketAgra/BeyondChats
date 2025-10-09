import jwt from 'jsonwebtoken'
import User from '../schemas/User.js'
import ChatMessage from '../schemas/ChatMessage.js'
import {generateStreamingResponse} from '../services/pdfAssistent.service.js'
import { 
  addToMemory, 
  getConversationHistory, 
  loadMemoryFromDatabase,
  clearMemory,
  getMemoryStats
} from '../services/chatMemory.service.js'

/**
 * Socket.IO Chat Handler for Real-time PDF Assistant
 * Similar to ChatGPT streaming experience
 */

export function setupSocketHandlers(io) {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      
      if (!user) {
        return next(new Error('Authentication error: User not found'))
      }

      socket.user = user
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {


    // Join PDF-specific room and load conversation memory
    socket.on('join-pdf', async ({ pdfId }) => {
      if (pdfId) {
        socket.join(`pdf-${pdfId}`)

        
        // Load conversation history from database into memory
        await loadMemoryFromDatabase(socket.user._id, pdfId)
        
        // Send memory stats to client
        const stats = getMemoryStats(socket.user._id, pdfId)
        socket.emit('memory-loaded', stats)
      }
    })

    // Leave PDF room
    socket.on('leave-pdf', ({ pdfId }) => {
      if (pdfId) {
        socket.leave(`pdf-${pdfId}`)

      }
    })

    // Handle chat message with streaming response
    socket.on('chat-message', async ({ content, pdfId, conversationHistory = [] }) => {
      try {
        if (!content || !content.trim()) {
          socket.emit('chat-error', { error: 'Message content is required' })
          return
        }

        // Save user message to database
        const userMessage = await ChatMessage.create({
          user: socket.user._id,
          role: 'user',
          content: content.trim(),
          pdfId: pdfId || null
        })

        // Emit user message confirmation
        socket.emit('message-saved', {
          messageId: userMessage._id,
          content: userMessage.content,
          role: 'user',
          timestamp: userMessage.createdAt
        })

        // Emit typing indicator
        socket.emit('ai-typing', { isTyping: true })

        let fullResponse = ''
        
        // Generate streaming response with memory integration
        const result = await generateStreamingResponse({
          question: content,
          pdfId,
          conversationHistory,
          userId: socket.user._id,  // Pass userId for memory integration
          onChunk: (chunk) => {
            fullResponse += chunk
            // Stream each chunk to the client
            socket.emit('ai-response-chunk', { chunk })
          }
        })

        // Emit typing stopped
        socket.emit('ai-typing', { isTyping: false })

        if (result.success) {
          // Save AI response to database
          const aiMessage = await ChatMessage.create({
            user: socket.user._id,
            role: 'ai',
            content: fullResponse || result.response,
            pdfId: pdfId || null,
            meta: {
              hasContext: result.hasContext,
              memoryUsed: result.memoryUsed || false
            }
          })

          // Emit completion with message ID
          socket.emit('ai-response-complete', {
            messageId: aiMessage._id,
            content: aiMessage.content,
            timestamp: aiMessage.createdAt,
            hasContext: result.hasContext,
            memoryUsed: result.memoryUsed || false
          })
        } else {
          // Handle error and send fallback
          socket.emit('ai-typing', { isTyping: false })
          socket.emit('chat-error', {
            error: result.error || 'Failed to generate response',
            fallback: result.fallback
          })

          // Save fallback message
          if (result.fallback) {
            const fallbackMessage = await ChatMessage.create({
              user: socket.user._id,
              role: 'ai',
              content: result.fallback,
              pdfId: pdfId || null,
              meta: {
                isFallback: true
              }
            })

            socket.emit('ai-response-complete', {
              messageId: fallbackMessage._id,
              content: fallbackMessage.content,
              timestamp: fallbackMessage.createdAt,
              isFallback: true
            })
          }
        }
      } catch (error) {
        console.error('Chat message error:', error)
        socket.emit('ai-typing', { isTyping: false })
        socket.emit('chat-error', {
          error: 'An error occurred while processing your message',
          message: error.message
        })
      }
    })

    // Handle message history request
    socket.on('get-chat-history', async ({ pdfId, limit = 50 }) => {
      try {
        const query = { user: socket.user._id }
        if (pdfId) query.pdfId = pdfId

        const messages = await ChatMessage.find(query)
          .sort({ createdAt: -1 })
          .limit(Number(limit))
          .lean()

        socket.emit('chat-history', {
          messages: messages.reverse(),
          pdfId
        })
      } catch (error) {
        console.error('Chat history error:', error)
        socket.emit('chat-error', {
          error: 'Failed to load chat history',
          message: error.message
        })
      }
    })

    // Handle typing indicator from user
    socket.on('user-typing', ({ pdfId, isTyping }) => {
      if (pdfId) {
        socket.to(`pdf-${pdfId}`).emit('user-typing', {
          userId: socket.user._id,
          email: socket.user.email,
          isTyping
        })
      }
    })

    // Disconnect handler
    socket.on('disconnect', () => {

    })

    // Error handler
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.user.email}:`, error)
    })
  })
}

export default setupSocketHandlers
