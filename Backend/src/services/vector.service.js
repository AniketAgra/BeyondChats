/**
 * Vector Service - Pinecone Operations
 * Handles all vector database operations for RAG
 */

import { getPineconeIndex, isPineconeAvailable } from '../config/pinecone.js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Generate embeddings using OpenAI
 * Using text-embedding-3-small (1536 dimensions, cost-effective)
 */
export async function generateEmbedding(text) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 1536 dimensions
      input: text
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    throw error
  }
}

/**
 * Store PDF chunk embeddings in Pinecone
 * Namespace: userId/pdfId
 */
export async function storePDFEmbeddings(userId, pdfId, chunks) {
  if (!isPineconeAvailable()) {
    console.warn('Pinecone not available, skipping embedding storage')
    return { success: false, reason: 'pinecone_unavailable' }
  }

  try {
    const index = getPineconeIndex()
    const namespace = `${userId}_${pdfId}`

    const vectors = await Promise.all(
      chunks.map(async (chunk, idx) => {
        const embedding = await generateEmbedding(chunk.text)
        return {
          id: `${pdfId}_chunk_${idx}`,
          values: embedding,
          metadata: {
            userId: String(userId),
            pdfId: String(pdfId),
            chunkIndex: idx,
            text: chunk.text.substring(0, 500), // Store excerpt
            chapter: chunk.chapter || '',
            pageNumber: chunk.pageNumber || 0,
            type: 'pdf_chunk'
          }
        }
      })
    )

    await index.namespace(namespace).upsert(vectors)

    return { 
      success: true, 
      count: vectors.length,
      namespace 
    }
  } catch (error) {
    console.error('Failed to store PDF embeddings:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Store quiz performance data
 */
export async function storeQuizPerformance(userId, quizData) {
  if (!isPineconeAvailable()) return { success: false }

  try {
    const index = getPineconeIndex()
    const namespace = `${userId}_performance`

    const text = `Quiz on ${quizData.topic}: Score ${quizData.score}%. Weak areas: ${quizData.weakTopics.join(', ')}`
    const embedding = await generateEmbedding(text)

    await index.namespace(namespace).upsert([{
      id: `quiz_${quizData.quizId}`,
      values: embedding,
      metadata: {
        userId: String(userId),
        quizId: String(quizData.quizId),
        pdfId: String(quizData.pdfId),
        topic: quizData.topic,
        score: quizData.score,
        weakTopics: quizData.weakTopics,
        timestamp: new Date().toISOString(),
        type: 'quiz_performance'
      }
    }])

    return { success: true }
  } catch (error) {
    console.error('Failed to store quiz performance:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Query vectors for RAG - General AI Study Buddy
 * Searches across ALL user's data (PDFs, quizzes, performance)
 * Used for cross-PDF mentoring and performance-based guidance
 */
export async function queryGeneralContext(userId, query, topK = 5) {
  console.log(`[Vector Service] Querying general context for user: ${userId}`)
  
  if (!isPineconeAvailable()) {
    console.warn('[Vector Service] Pinecone not available, returning empty matches')
    return { success: false, matches: [] }
  }

  try {
    const embedding = await generateEmbedding(query)
    const index = getPineconeIndex()
    
    console.log(`[Vector Service] Generated embedding for query: "${query.substring(0, 50)}..."`)

    // Search in performance namespace for quiz data
    const performanceNamespace = `${userId}_performance`
    
    let performanceMatches = []
    try {
      const performanceResults = await index.namespace(performanceNamespace).query({
        vector: embedding,
        topK: Math.min(topK, 5),
        includeMetadata: true
      })
      
      performanceMatches = performanceResults.matches.map(m => ({
        score: m.score,
        text: m.metadata.text || `Quiz performance data`,
        metadata: m.metadata,
        type: 'performance'
      }))
      
      console.log(`[Vector Service] Found ${performanceMatches.length} performance matches`)
    } catch (perfError) {
      console.warn('[Vector Service] Error querying performance namespace:', perfError.message)
    }

    // Get all user PDFs and search their namespaces
    const Pdf = (await import('../schemas/Pdf.js')).default
    const userPDFs = await Pdf.find({ user: userId }).select('_id').lean()
    
    console.log(`[Vector Service] User has ${userPDFs.length} PDFs to search`)
    
    const pdfMatches = []
    
    // Search up to 5 most recent PDFs
    for (const pdf of userPDFs.slice(0, 5)) {
      try {
        const pdfNamespace = `${userId}_${pdf._id}`
        const pdfResults = await index.namespace(pdfNamespace).query({
          vector: embedding,
          topK: 2,
          includeMetadata: true
        })
        
        pdfResults.matches.forEach(m => {
          if (m.score > 0.7) { // Only include highly relevant matches
            pdfMatches.push({
              score: m.score,
              text: m.metadata.text || 'PDF content',
              metadata: m.metadata,
              type: 'pdf'
            })
          }
        })
      } catch (pdfError) {
        console.warn(`[Vector Service] Error querying PDF ${pdf._id}:`, pdfError.message)
      }
    }
    
    console.log(`[Vector Service] Found ${pdfMatches.length} relevant PDF matches`)

    const allMatches = [...performanceMatches, ...pdfMatches]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    console.log(`[Vector Service] Returning ${allMatches.length} total matches`)

    return {
      success: true,
      matches: allMatches
    }
  } catch (error) {
    console.error('[Vector Service] Failed to query general context:', error)
    return { success: false, matches: [], error: error.message }
  }
}

/**
 * Query vectors for PDF-specific context
 * Used by PDF Buddy for focused, document-specific answers
 */
export async function queryPDFContext(userId, pdfId, query, topK = 5) {
  if (!isPineconeAvailable()) {
    console.warn('[Vector Service] Pinecone not available for PDF query')
    return { success: false, matches: [] }
  }

  try {
    const embedding = await generateEmbedding(query)
    const index = getPineconeIndex()
    const namespace = `${userId}_${pdfId}`

    const results = await index.namespace(namespace).query({
      vector: embedding,
      topK,
      includeMetadata: true
    })

    const matches = results.matches.map(m => ({
      score: m.score,
      text: m.metadata.text || '',
      chapter: m.metadata.chapter || '',
      pageNumber: m.metadata.pageNumber || 0,
      metadata: m.metadata
    }))

    return {
      success: true,
      matches
    }
  } catch (error) {
    console.error('[Vector Service] Failed to query PDF context:', error)
    return { success: false, matches: [], error: error.message }
  }
}

/**
 * Delete PDF embeddings
 */
export async function deletePDFEmbeddings(userId, pdfId) {
  if (!isPineconeAvailable()) return { success: false }

  try {
    const index = getPineconeIndex()
    const namespace = `${userId}_${pdfId}`

    await index.namespace(namespace).deleteAll()

    return { success: true }
  } catch (error) {
    console.error('Failed to delete PDF embeddings:', error)
    return { success: false, error: error.message }
  }
}

export default {
  generateEmbedding,
  storePDFEmbeddings,
  storeQuizPerformance,
  queryGeneralContext,
  queryPDFContext,
  deletePDFEmbeddings
}
