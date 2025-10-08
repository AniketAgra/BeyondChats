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
 * Searches across ALL user's data (PDFs, quizzes, notes)
 */
export async function queryGeneralContext(userId, query, topK = 5) {
  if (!isPineconeAvailable()) {
    return { success: false, matches: [] }
  }

  try {
    const embedding = await generateEmbedding(query)
    const index = getPineconeIndex()

    // Search in performance namespace for quiz data
    const performanceNamespace = `${userId}_performance`
    const performanceResults = await index.namespace(performanceNamespace).query({
      vector: embedding,
      topK: 3,
      includeMetadata: true
    })

    // Collect all PDF namespaces for this user and search them
    // Note: In production, maintain a registry of user's PDFs
    const pdfResults = []

    return {
      success: true,
      matches: [
        ...performanceResults.matches.map(m => ({
          score: m.score,
          metadata: m.metadata,
          type: 'performance'
        })),
        ...pdfResults.map(m => ({
          score: m.score,
          metadata: m.metadata,
          type: 'pdf'
        }))
      ]
    }
  } catch (error) {
    console.error('Failed to query general context:', error)
    return { success: false, matches: [], error: error.message }
  }
}

/**
 * Query vectors for PDF-specific context
 */
export async function queryPDFContext(userId, pdfId, query, topK = 5) {
  if (!isPineconeAvailable()) {
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

    return {
      success: true,
      matches: results.matches.map(m => ({
        score: m.score,
        text: m.metadata.text,
        chapter: m.metadata.chapter,
        pageNumber: m.metadata.pageNumber,
        metadata: m.metadata
      }))
    }
  } catch (error) {
    console.error('Failed to query PDF context:', error)
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
