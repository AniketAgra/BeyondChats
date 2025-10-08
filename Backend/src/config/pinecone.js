/**
 * Pinecone Configuration for RAG (Retrieval-Augmented Generation)
 * Stores embeddings for PDFs, notes, quiz data, and conversation history
 */

// Note: Install @pinecone-database/pinecone package
// npm install @pinecone-database/pinecone

let pineconeClient = null

/**
 * Initialize Pinecone client
 */
export async function initPinecone() {
  try {
    // Check if Pinecone credentials are available
    if (!process.env.PINECONE_API_KEY) {
      console.warn('⚠️  Pinecone API key not found. RAG features will be disabled.')
      return null
    }

    const { Pinecone } = await import('@pinecone-database/pinecone')
    
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1'
    })

    console.log('✅ Pinecone initialized successfully')
    return pineconeClient
  } catch (error) {
    console.error('❌ Failed to initialize Pinecone:', error.message)
    return null
  }
}

/**
 * Get Pinecone index
 */
export function getPineconeIndex() {
  if (!pineconeClient) {
    console.warn('⚠️  Pinecone not initialized')
    return null
  }

  const indexName = process.env.PINECONE_INDEX_NAME || 'edulearn-vectors'
  return pineconeClient.index(indexName)
}

/**
 * Check if Pinecone is available
 */
export function isPineconeAvailable() {
  return pineconeClient !== null
}

export default {
  initPinecone,
  getPineconeIndex,
  isPineconeAvailable
}
