/**
 * AI PDF Buddy Service - PDF-Specific Chat
 * Lightweight assistant for PDF-specific questions
 */

import OpenAI from 'openai'
import { queryPDFContext } from './vector.service.js'
import Pdf from '../schemas/Pdf.js'
import QuizAttempt from '../schemas/QuizAttempt.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Get PDF-specific quiz performance
 */
async function getPDFQuizPerformance(userId, pdfId) {
  try {
    const attempts = await QuizAttempt.find({ user: userId, pdf: pdfId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    if (attempts.length === 0) return null

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

    return {
      totalAttempts: attempts.length,
      averageScore: avgScore.toFixed(1),
      weakTopics,
      lastAttempt: attempts[0]
    }
  } catch (error) {
    console.error('Failed to get PDF quiz performance:', error)
    return null
  }
}

/**
 * Generate PDF Buddy response (Light RAG - max 200 words)
 */
export async function generatePDFBuddyResponse({ 
  userId, 
  pdfId, 
  question, 
  conversationHistory = [] 
}) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        response: "I'm not fully configured yet. Please add your OpenAI API key to enable AI responses.",
        hasContext: false
      }
    }

    // Get PDF info
    const pdf = await Pdf.findById(pdfId).lean()
    if (!pdf) {
      return {
        success: false,
        response: "I couldn't find information about this PDF."
      }
    }

    // Get vector search results for this PDF
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
    if (ragResults.success && ragResults.matches.length > 0) {
      contextText = '\n\nRelevant content from PDF:\n'
      ragResults.matches.forEach((match, i) => {
        if (match.score > 0.7) {
          contextText += `\n${i + 1}. ${match.text}\n`
        }
      })
    }

    let performanceText = ''
    if (quizPerformance) {
      performanceText = `\n\nYour performance on this PDF: ${quizPerformance.averageScore}% average (${quizPerformance.totalAttempts} quizzes)`
      if (quizPerformance.weakTopics.length > 0) {
        performanceText += `\nTopics to review: ${quizPerformance.weakTopics.join(', ')}`
      }
    }

    const systemPrompt = `You are a PDF Buddy - a quick helper for this specific document.

**PDF**: "${pdf.title}"${pdf.author ? ` by ${pdf.author}` : ''}
${contextText}
${performanceText}

**Guidelines**:
- Keep responses SHORT (under 200 words)
- Be direct and focused
- Use the PDF content provided
- If performance data shows weak areas, mention them briefly
- For detailed explanations, suggest the AI Study Buddy
- Be friendly but concise`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: question }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 300  // Limit for shorter responses
    })

    const response = completion.choices[0].message.content

    // Check if response is too long
    const wordCount = response.split(/\s+/).length
    if (wordCount > 250) {
      return {
        success: true,
        response: response.split(/\s+/).slice(0, 200).join(' ') + '...\n\n💡 For more details, visit AI Study Buddy!',
        hasContext: ragResults.success,
        truncated: true
      }
    }

    return {
      success: true,
      response,
      hasContext: ragResults.success,
      quizPerformance
    }
  } catch (error) {
    console.error('PDF Buddy error:', error)
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
