import dotenv from 'dotenv'
import Pdf from '../schemas/Pdf.js'
import { 
  addToMemory, 
  getConversationHistory, 
  loadMemoryFromDatabase,
  formatHistoryForPrompt,
  needsContextRefresh 
} from './chatMemory.service.js'

dotenv.config()

/**
 * PDF Assistant Service
 * Provides real-time AI-powered responses for PDF-related questions
 * Supports streaming responses like ChatGPT
 */

// LLM Client Setup
async function createLlmClient() {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase()
  
  if (provider === 'gemini' || provider === 'google') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) return null
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    
    return {
      async generate({ model = 'gemini-2.0-flash-exp', prompt }) {
        const m = genAI.getGenerativeModel({ model })
        const res = await m.generateContent(prompt)
        const text = res.response?.text?.() || res.response?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        return { text }
      },
      
      async generateStream({ model = 'gemini-2.0-flash-exp', prompt, onChunk }) {
        const m = genAI.getGenerativeModel({ model })
        const result = await m.generateContentStream(prompt)
        
        let fullText = ''
        for await (const chunk of result.stream) {
          const chunkText = chunk.text()
          fullText += chunkText
          if (onChunk) onChunk(chunkText)
        }
        
        return { text: fullText }
      }
    }
  }
  
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return null
    
    const { default: axios } = await import('axios')
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    
    return {
      async generate({ prompt }) {
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          { 
            model, 
            messages: [{ role: 'user', content: prompt }], 
            temperature: 0.7, 
            max_tokens: 2000 
          },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        )
        const text = res.data?.choices?.[0]?.message?.content || ''
        return { text }
      },
      
      async generateStream({ prompt, onChunk }) {
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          { 
            model, 
            messages: [{ role: 'user', content: prompt }], 
            temperature: 0.7, 
            max_tokens: 2000,
            stream: true
          },
          { 
            headers: { Authorization: `Bearer ${apiKey}` },
            responseType: 'stream'
          }
        )
        
        let fullText = ''
        res.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '')
              if (data === '[DONE]') return
              try {
                const parsed = JSON.parse(data)
                const text = parsed.choices?.[0]?.delta?.content || ''
                if (text) {
                  fullText += text
                  if (onChunk) onChunk(text)
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        })
        
        return new Promise((resolve) => {
          res.data.on('end', () => resolve({ text: fullText }))
        })
      }
    }
  }
  
  return null
}

let llmClientPromise
async function getClient() {
  if (!llmClientPromise) llmClientPromise = createLlmClient()
  return llmClientPromise
}

/**
 * Get PDF content and metadata
 */
async function getPdfContext(pdfId) {
  if (!pdfId) return null
  
  try {
    const pdf = await Pdf.findById(pdfId).lean()
    if (!pdf) return null
    
    return {
      title: pdf.title || pdf.filename || 'PDF Document',
      content: pdf.extractedText || pdf.content || '',
      chapters: pdf.chapters || [],
      summary: pdf.summary || '',
      keyPoints: pdf.keyPoints || [],
      pages: pdf.pages || 0
    }
  } catch (error) {
    console.error('Error fetching PDF context:', error)
    return null
  }
}

/**
 * Check if question requires detailed explanation
 */
function requiresDetailedResponse(question) {
  const q = question.toLowerCase()
  const detailedKeywords = [
    'elaborate', 'explain in detail', 'detailed explanation', 'explain more',
    'tell me more', 'more information', 'in depth', 'comprehensive',
    'thorough explanation', 'step by step', 'walk me through',
    'detailed summary', 'complete explanation', 'full explanation',
    'break down', 'deep dive', 'analyze in detail'
  ]
  
  return detailedKeywords.some(keyword => q.includes(keyword))
}

/**
 * Generate redirect message for detailed questions
 */
function generateDetailedRedirectMessage() {
  return `I'm here to provide quick help and short answers! 🤖

For detailed explanations, comprehensive guidance, and in-depth learning with personalized teaching:

**Visit our AI Mentor** 🎓
Click the AI Mentor icon to access:
✨ Detailed explanations and elaborations
✨ Step-by-step guidance like a personal tutor
✨ Performance tracking and improvement suggestions
✨ Comprehensive summaries and analysis
✨ Personalized learning recommendations

The AI Mentor has access to all your chat history, PDF content, quiz performance, and can provide the deep, thorough guidance you're looking for!

For now, feel free to ask me quick questions or specific queries! 😊`
}

/**
 * Build context-aware prompt for PDF assistant (limited response)
 */
function buildAssistantPrompt(question, pdfContext, conversationHistory = [], isLimited = true) {
  const parts = []
  
  parts.push('You are an AI Pdf Buddy assistant in a chat panel with limited space. You provide quick, concise, helpful answers.')
  parts.push('IMPORTANT: Keep responses SHORT and CONCISE (maximum 80-100 words, 2-3 sentences).')
  parts.push('')

  if (pdfContext) {
    parts.push('DOCUMENT CONTEXT:')
    parts.push(`Title: ${pdfContext.title}`)
    parts.push(`Pages: ${pdfContext.pages}`)
    parts.push('')
    
    if (pdfContext.summary) {
      parts.push(`Summary: ${pdfContext.summary}`)
      parts.push('')
    }
    
    if (pdfContext.keyPoints && pdfContext.keyPoints.length > 0) {
      parts.push('Key Points:')
      pdfContext.keyPoints.slice(0, 5).forEach((kp, i) => {
        parts.push(`${i + 1}. ${kp}`)
      })
      parts.push('')
    }
    
    if (pdfContext.content) {
      const contentPreview = pdfContext.content.substring(0, 3000)
      parts.push('Content Preview:')
      parts.push(contentPreview)
      if (pdfContext.content.length > 3000) {
        parts.push('...(document continues)')
      }
      parts.push('')
    }
  }

  if (conversationHistory.length > 0) {
    parts.push('RECENT CONVERSATION:')
    parts.push('(Use this to understand context and provide relevant follow-up responses)')
    const formattedHistory = formatHistoryForPrompt(conversationHistory, 5)
    parts.push(formattedHistory)
    parts.push('')
  }

  parts.push('CURRENT QUESTION:')
  parts.push(`Student: ${question}`)
  parts.push('')
  parts.push('INSTRUCTIONS:')
  parts.push('- Keep response VERY SHORT: maximum 80-100 words (2-3 sentences)')
  parts.push('- Answer the question directly and concisely')
  parts.push('- Use conversation history to provide contextual responses')
  parts.push('- If the question refers to "it", "that", "the previous", etc., check conversation history')
  parts.push('- Use simple, clear language')
  parts.push('- Add one emoji for friendliness')
  parts.push('- If question needs detailed answer, say "This needs more explanation - visit AI Mentor for detailed guidance!"')
  parts.push('- For summaries, provide only 2-3 key points maximum')
  parts.push('- For explanations, give only the core concept in 1-2 sentences')
  parts.push('- NEVER exceed 100 words')
  parts.push('')
  parts.push('Assistant (SHORT response):')

  return parts.join('\n')
}

/**
 * Generate response (non-streaming) with memory integration
 */
export async function generateResponse({ question, pdfId, conversationHistory = [], userId = null }) {
  // Check if question requires detailed response
  if (requiresDetailedResponse(question)) {
    return {
      success: true,
      response: generateDetailedRedirectMessage(),
      hasContext: false,
      redirectToMentor: true
    }
  }
  
  const client = await getClient()
  
  if (!client) {
    return {
      success: false,
      error: 'AI service not configured',
      fallback: generateFallbackResponse(question)
    }
  }

  try {
    // Load memory if userId provided and memory needs refresh
    let memoryHistory = conversationHistory
    if (userId) {
      if (needsContextRefresh(userId, pdfId)) {
        await loadMemoryFromDatabase(userId, pdfId)
      }
      // Get conversation history from memory
      memoryHistory = getConversationHistory(userId, pdfId, 5)
      
      // Add user message to memory
      addToMemory(userId, pdfId, 'user', question)
    }
    
    const pdfContext = await getPdfContext(pdfId)
    const prompt = buildAssistantPrompt(question, pdfContext, memoryHistory, true)
    
    const response = await client.generate({ prompt })
    
    // Trim response to word limit
    const trimmedResponse = trimToWordLimit(response.text, 100)
    
    // Add AI response to memory
    if (userId) {
      addToMemory(userId, pdfId, 'ai', trimmedResponse)
    }
    
    return {
      success: true,
      response: trimmedResponse,
      hasContext: !!pdfContext,
      wasTrimmed: trimmedResponse !== response.text,
      memoryUsed: memoryHistory.length > 0
    }
  } catch (error) {
    console.error('Error generating response:', error)
    return {
      success: false,
      error: error.message,
      fallback: generateFallbackResponse(question)
    }
  }
}

/**
 * Generate streaming response with memory integration
 */
export async function generateStreamingResponse({ question, pdfId, conversationHistory = [], onChunk, userId = null }) {
  // Check if question requires detailed response
  if (requiresDetailedResponse(question)) {
    const redirectMessage = generateDetailedRedirectMessage()
    
    // Simulate streaming for redirect message
    if (onChunk) {
      const words = redirectMessage.split(' ')
      for (const word of words) {
        onChunk(word + ' ')
        await new Promise(resolve => setTimeout(resolve, 30))
      }
    }
    
    return {
      success: true,
      response: redirectMessage,
      hasContext: false,
      redirectToMentor: true
    }
  }
  
  const client = await getClient()
  
  if (!client || !client.generateStream) {
    // Fallback to non-streaming
    const result = await generateResponse({ question, pdfId, conversationHistory, userId })
    if (result.success) {
      // Simulate streaming for non-streaming clients
      const words = result.response.split(' ')
      for (const word of words) {
        if (onChunk) onChunk(word + ' ')
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    return result
  }

  try {
    // Load memory if userId provided and memory needs refresh
    let memoryHistory = conversationHistory
    if (userId) {
      if (needsContextRefresh(userId, pdfId)) {
        await loadMemoryFromDatabase(userId, pdfId)
      }
      // Get conversation history from memory
      memoryHistory = getConversationHistory(userId, pdfId, 5)
      
      // Add user message to memory
      addToMemory(userId, pdfId, 'user', question)
    }
    
    const pdfContext = await getPdfContext(pdfId)
    const prompt = buildAssistantPrompt(question, pdfContext, memoryHistory, true)
    
    let wordCount = 0
    let isTrimmed = false
    let fullResponse = ''
    
    const response = await client.generateStream({ 
      prompt, 
      onChunk: (chunk) => {
        fullResponse += chunk
        // Count words and stop if exceeding limit
        const words = chunk.split(/\s+/).filter(w => w.length > 0)
        wordCount += words.length
        
        if (wordCount <= 100) {
          onChunk(chunk)
        } else if (!isTrimmed) {
          // Send trimming message
          onChunk('\n\n💬 [For complete answer, visit AI Mentor!]')
          isTrimmed = true
        }
      }
    })
    
    // Trim full response as well
    const trimmedResponse = trimToWordLimit(fullResponse || response.text, 100)
    
    // Add AI response to memory
    if (userId) {
      addToMemory(userId, pdfId, 'ai', trimmedResponse)
    }
    
    return {
      success: true,
      response: trimmedResponse,
      hasContext: !!pdfContext,
      wasTrimmed: isTrimmed || trimmedResponse !== response.text,
      memoryUsed: memoryHistory.length > 0
    }
  } catch (error) {
    console.error('Error generating streaming response:', error)
    return {
      success: false,
      error: error.message,
      fallback: generateFallbackResponse(question)
    }
  }
}

/**
 * Trim response to word limit
 */
function trimToWordLimit(text, maxWords = 100) {
  const words = text.split(/\s+/)
  if (words.length <= maxWords) return text
  
  const trimmed = words.slice(0, maxWords).join(' ')
  return trimmed + '... 💬 [Visit AI Mentor for complete answer]'
}

/**
 * Fallback responses when AI is unavailable
 */
function generateFallbackResponse(question) {
  const q = question.toLowerCase()
  
  // Check for detailed questions
  if (requiresDetailedResponse(q)) {
    return generateDetailedRedirectMessage()
  }
  
  if (q.match(/^(hi|hello|hey)/)) {
    return "Hello! 👋 I'm your quick AI buddy here in the chat. For detailed help, check out our AI Mentor!"
  }
  
  if (q.includes('summarize') || q.includes('summary')) {
    return "📝 Quick summary available in Key Features! For detailed analysis, visit AI Mentor. Having issues? Try again!"
  }
  
  if (q.includes('explain')) {
    return "💡 I can give quick answers! For detailed explanations, visit our AI Mentor for comprehensive guidance."
  }
  
  return "🤖 I'm here for quick help! For detailed guidance, visit AI Mentor. Try asking again or check Key Features!"
}

export default {
  generateResponse,
  generateStreamingResponse,
  getPdfContext
}
