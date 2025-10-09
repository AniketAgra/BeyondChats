/**
 * AI PDF Buddy Service - PDF-Specific Chat
 * Lightweight assistant for PDF-specific questions
 */

import { GoogleGenAI } from '@google/genai'
import { queryPDFContext } from './vector.service.js'
import Pdf from '../schemas/Pdf.js'
import QuizAttempt from '../schemas/QuizAttempt.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

/**
 * Get PDF-specific quiz performance
 */
async function getPDFQuizPerformance(userId, pdfId) {
  console.log(`[PDF Buddy] Fetching quiz performance for PDF: ${pdfId}`)
  
  try {
    const attempts = await QuizAttempt.find({ user: userId, pdf: pdfId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    if (attempts.length === 0) {
      console.log('[PDF Buddy] No quiz attempts found for this PDF')
      return null
    }

    const avgScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length

    const weakTopics = []
    attempts.forEach(attempt => {
      if (attempt.answers) {
        attempt.answers.forEach((ans, idx) => {
          if (!ans.isCorrect && attempt.questions?.[idx]) {
            const topic = attempt.questions[idx].topic
            if (topic && !weakTopics.includes(topic)) {
              weakTopics.push(topic)
            }
          }
        })
      }
    })

    console.log(`[PDF Buddy] Found ${attempts.length} attempts, avg score: ${avgScore.toFixed(1)}%`)

    return {
      totalAttempts: attempts.length,
      averageScore: avgScore.toFixed(1),
      weakTopics,
      lastAttempt: attempts[0]
    }
  } catch (error) {
    console.error('[PDF Buddy] Failed to get PDF quiz performance:', error)
    return null
  }
}

/**
 * Generate PDF Buddy response (Focused, PDF-specific RAG - max 200 words)
 */
export async function generatePDFBuddyResponse({ 
  userId, 
  pdfId, 
  question, 
  conversationHistory = [] 
}) {
  console.log(`[PDF Buddy] ======= GENERATING PDF RESPONSE =======`)
  console.log(`[PDF Buddy] User: ${userId}, PDF: ${pdfId}`)
  console.log(`[PDF Buddy] Question: "${question}"`)
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('[PDF Buddy] Missing GEMINI_API_KEY')
      return {
        success: false,
        response: "I'm not fully configured yet. Please add your Gemini API key to enable AI responses.",
        hasContext: false
      }
    }

    // Get PDF info
    console.log('[PDF Buddy] Fetching PDF details...')
    const pdf = await Pdf.findById(pdfId).lean()
    if (!pdf) {
      console.error('[PDF Buddy] ❌ PDF not found')
      return {
        success: false,
        response: "I couldn't find information about this PDF."
      }
    }
    console.log(`[PDF Buddy] PDF found: "${pdf.title}"`)

    // Get vector search results for THIS SPECIFIC PDF ONLY
    console.log('[PDF Buddy] Querying PDF-specific vectors...')
    const ragResults = await queryPDFContext(userId, pdfId, question, 3)
    
    // Get PDF-specific quiz performance
    const quizPerformance = await getPDFQuizPerformance(userId, pdfId)

    // Check for redirect keywords
    const redirectKeywords = ['elaborate', 'in detail', 'detailed explanation', 'explain more', 'teach me', 'deep dive']
    const shouldRedirect = redirectKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    )

    if (shouldRedirect) {
      return {
        success: true,
        response: `I can give you a quick overview here 😊\n\nFor a comprehensive, detailed explanation with personalized guidance based on your overall performance, I recommend visiting the **AI Study Buddy**!\n\nClick the AI brain icon at the bottom right to get deep insights and mentoring. 🧠✨`,
        shouldRedirect: true,
        hasContext: false
      }
    }

    // Build context for PDF-specific response
    let contextText = ''
    
    // First, check for RAG results
    if (ragResults.success && ragResults.matches.length > 0) {
      contextText = '\n\nRelevant content from PDF:\n'
      ragResults.matches.forEach((match, i) => {
        if (match.score > 0.7) {
          contextText += `\n${i + 1}. ${match.text}\n`
        }
      })
      console.log('[PDF Buddy] Using RAG matches for context')
    } else {
      // Fallback: Use PDF summary and extracted text from database
      console.log('[PDF Buddy] No RAG matches, using PDF summary and content')
      
      if (pdf.summary) {
        contextText += `\n\n**Summary**: ${pdf.summary}\n`
      }
      
      if (pdf.keyPoints && pdf.keyPoints.length > 0) {
        contextText += `\n**Key Points**:\n`
        pdf.keyPoints.slice(0, 5).forEach((point, i) => {
          contextText += `${i + 1}. ${point}\n`
        })
      }
      
      if (pdf.extractedText || pdf.content) {
        const pdfContent = pdf.extractedText || pdf.content || ''
        // Include first 3000 characters of PDF content
        if (pdfContent.length > 0) {
          contextText += `\n**Content Preview** (first section):\n${pdfContent.substring(0, 3000)}`
          if (pdfContent.length > 3000) {
            contextText += '...\n'
          }
        }
      }
    }

    let performanceText = ''
    if (quizPerformance) {
      performanceText = `\n\nYour performance on this PDF: ${quizPerformance.averageScore}% average (${quizPerformance.totalAttempts} quizzes)`
      if (quizPerformance.weakTopics.length > 0) {
        performanceText += `\nTopics to review: ${quizPerformance.weakTopics.join(', ')}`
      }
    }

    const systemPrompt = `You are a PDF Buddy - a focused assistant helping with questions about this specific document.

**Document**: "${pdf.title}"${pdf.author ? ` by ${pdf.author}` : ''}
${pdf.pages ? `**Pages**: ${pdf.pages}` : ''}
${contextText}
${performanceText}

**Your Role**:
- Provide DIRECT answers to questions about this PDF based on the content provided above
- Keep responses SHORT and FOCUSED (under 200 words)
- Use the information from the PDF content, summary, and key points provided
- If asking for a summary, use the Summary and Key Points sections provided
- If the question is about specific content not covered, say: "I don't see that specific detail in the sections I have access to. Could you ask about a different aspect or be more specific?"
- If performance data shows weak areas, briefly mention them
- For in-depth explanations or broader topics, suggest: "For a more comprehensive explanation, check out the AI Study Buddy!"
- Be conversational, helpful, and use emojis occasionally 😊

**Important**:
- Answer based on the PDF content, summary, and key points provided above
- If content is provided, always give a helpful response
- Stay on topic - this is about THIS specific PDF
- Be concise but complete`

    // Build conversation history for Gemini
    let conversationContext = ''
    if (conversationHistory.length > 0) {
      conversationContext = '\n\n**Previous conversation:**\n'
      conversationHistory.slice(-4).forEach(msg => {
        conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
      })
    }

    const fullPrompt = `${systemPrompt}

${conversationContext}

**User Question**: ${question}

**Your Response** (under 200 words):`

    console.log('[PDF Buddy] Calling Gemini API...')
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: fullPrompt,
      config: {
        temperature: 0.7
      }
    })
    
    const response = result.text
    
    console.log(`[PDF Buddy] ✅ Generated response (${response.length} chars)`)

    // Check if response is too long (PDF Buddy should be concise)
    const wordCount = response.split(/\s+/).length
    if (wordCount > 250) {
      console.log(`[PDF Buddy] Response too long (${wordCount} words), truncating...`)
      return {
        success: true,
        response: response.split(/\s+/).slice(0, 200).join(' ') + '...\n\n💡 For more details, visit AI Study Buddy!',
        hasContext: ragResults.success,
        truncated: true
      }
    }

    console.log('[PDF Buddy] ✅ Response complete')

    return {
      success: true,
      response,
      hasContext: ragResults.success,
      quizPerformance
    }
  } catch (error) {
    console.error('[PDF Buddy] ❌ Error generating response:', error)
    console.error('[PDF Buddy] Error stack:', error.stack)
    return {
      success: false,
      response: "I'm having trouble accessing this PDF's information. Please try again.",
      error: error.message
    }
  }
}

export default {
  generatePDFBuddyResponse,
  getPDFQuizPerformance
}
