/**
 * Chat Memory Service for PDF Buddy
 * 
 * Provides short-term memory management for conversational context
 * Features:
 * - Session-based memory storage
 * - Context window management (last N messages)
 * - Automatic memory cleanup
 * - Memory summarization for long conversations
 * - Token/word count management
 */

import ChatMessage from '../schemas/ChatMessage.js'

// In-memory cache for active sessions
const sessionMemory = new Map()

// Configuration
const CONFIG = {
  MAX_MESSAGES: 10,           // Maximum messages to keep in context
  MAX_WORDS: 1500,            // Maximum total words in context
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  CLEANUP_INTERVAL: 5 * 60 * 1000,  // 5 minutes
  SUMMARIZE_THRESHOLD: 8     // Summarize when history exceeds this
}

/**
 * Get session key for user and PDF
 */
function getSessionKey(userId, pdfId = 'general') {
  return `${userId}:${pdfId}`
}

/**
 * Initialize or get existing session memory
 */
export function getSessionMemory(userId, pdfId) {
  const key = getSessionKey(userId, pdfId)
  
  if (!sessionMemory.has(key)) {
    sessionMemory.set(key, {
      messages: [],
      lastActivity: Date.now(),
      userId,
      pdfId,
      wordCount: 0
    })
  } else {
    // Update last activity
    const session = sessionMemory.get(key)
    session.lastActivity = Date.now()
  }
  
  return sessionMemory.get(key)
}

/**
 * Add message to session memory
 */
export function addToMemory(userId, pdfId, role, content) {
  const session = getSessionMemory(userId, pdfId)
  
  const message = {
    role, // 'user' or 'ai'
    content,
    timestamp: Date.now(),
    wordCount: countWords(content)
  }
  
  session.messages.push(message)
  session.wordCount += message.wordCount
  
  // Trim if exceeds limits
  trimMemoryIfNeeded(session)
  
  return message
}

/**
 * Get conversation history for AI context
 */
export function getConversationHistory(userId, pdfId, maxMessages = CONFIG.MAX_MESSAGES) {
  const session = getSessionMemory(userId, pdfId)
  
  // Return recent messages formatted for AI
  return session.messages
    .slice(-maxMessages)
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }))
}

/**
 * Get recent messages from database
 */
export async function getRecentMessages(userId, pdfId, limit = CONFIG.MAX_MESSAGES) {
  try {
    const query = { user: userId }
    if (pdfId && pdfId !== 'general') {
      query.pdfId = pdfId
    }
    
    const messages = await ChatMessage
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    
    // Reverse to get chronological order
    return messages.reverse().map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt
    }))
  } catch (error) {
    console.error('Error fetching recent messages:', error)
    return []
  }
}

/**
 * Load conversation history from database into memory
 */
export async function loadMemoryFromDatabase(userId, pdfId) {
  const key = getSessionKey(userId, pdfId)
  
  // Check if already loaded
  if (sessionMemory.has(key)) {
    const session = sessionMemory.get(key)
    if (session.messages.length > 0) {
      return session
    }
  }
  
  // Load from database
  const messages = await getRecentMessages(userId, pdfId)
  
  // Initialize session with database messages
  const session = {
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
      wordCount: countWords(msg.content)
    })),
    lastActivity: Date.now(),
    userId,
    pdfId,
    wordCount: messages.reduce((sum, msg) => sum + countWords(msg.content), 0)
  }
  
  sessionMemory.set(key, session)
  trimMemoryIfNeeded(session)
  
  return session
}

/**
 * Count words in text
 */
function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

/**
 * Trim memory if it exceeds limits
 */
function trimMemoryIfNeeded(session) {
  // Trim by message count
  if (session.messages.length > CONFIG.MAX_MESSAGES) {
    const removed = session.messages.splice(0, session.messages.length - CONFIG.MAX_MESSAGES)
    session.wordCount -= removed.reduce((sum, msg) => sum + msg.wordCount, 0)
  }
  
  // Trim by word count
  while (session.wordCount > CONFIG.MAX_WORDS && session.messages.length > 2) {
    const removed = session.messages.shift()
    session.wordCount -= removed.wordCount
  }
  
  // Keep at least 2 messages (1 user + 1 ai) if available
  const minMessages = 2
  while (session.messages.length > minMessages && session.wordCount > CONFIG.MAX_WORDS) {
    const removed = session.messages.shift()
    session.wordCount -= removed.wordCount
  }
}

/**
 * Clear session memory
 */
export function clearMemory(userId, pdfId) {
  const key = getSessionKey(userId, pdfId)
  sessionMemory.delete(key)
}

/**
 * Clear all memory for a user
 */
export function clearUserMemory(userId) {
  const keysToDelete = []
  
  for (const [key, session] of sessionMemory.entries()) {
    if (session.userId.toString() === userId.toString()) {
      keysToDelete.push(key)
    }
  }
  
  keysToDelete.forEach(key => sessionMemory.delete(key))
  return keysToDelete.length
}

/**
 * Get memory statistics
 */
export function getMemoryStats(userId, pdfId) {
  const session = sessionMemory.get(getSessionKey(userId, pdfId))
  
  if (!session) {
    return {
      exists: false,
      messageCount: 0,
      wordCount: 0
    }
  }
  
  return {
    exists: true,
    messageCount: session.messages.length,
    wordCount: session.wordCount,
    lastActivity: new Date(session.lastActivity),
    oldestMessage: session.messages[0]?.timestamp ? new Date(session.messages[0].timestamp) : null,
    newestMessage: session.messages[session.messages.length - 1]?.timestamp 
      ? new Date(session.messages[session.messages.length - 1].timestamp) 
      : null
  }
}

/**
 * Get summary of conversation for context
 */
export function getConversationSummary(userId, pdfId) {
  const session = sessionMemory.get(getSessionKey(userId, pdfId))
  
  if (!session || session.messages.length === 0) {
    return null
  }
  
  const userMessages = session.messages.filter(m => m.role === 'user')
  const aiMessages = session.messages.filter(m => m.role === 'ai')
  
  // Extract key topics from user questions
  const topics = userMessages
    .map(m => extractKeyTopics(m.content))
    .flat()
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .slice(0, 5)
  
  return {
    totalMessages: session.messages.length,
    userQuestions: userMessages.length,
    aiResponses: aiMessages.length,
    topics,
    wordCount: session.wordCount,
    duration: Date.now() - session.messages[0]?.timestamp || 0
  }
}

/**
 * Extract key topics from question
 */
function extractKeyTopics(text) {
  const stopWords = ['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'a', 'an', 'can', 'you', 'me', 'about', 'explain', 'tell']
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 3)
}

/**
 * Cleanup expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now()
  const keysToDelete = []
  
  for (const [key, session] of sessionMemory.entries()) {
    if (now - session.lastActivity > CONFIG.SESSION_TIMEOUT) {
      keysToDelete.push(key)
    }
  }
  
  keysToDelete.forEach(key => sessionMemory.delete(key))
}

/**
 * Get all active sessions count
 */
export function getActiveSessionsCount() {
  return sessionMemory.size
}

/**
 * Get memory usage info
 */
export function getMemoryUsageInfo() {
  const sessions = Array.from(sessionMemory.values())
  
  return {
    activeSessions: sessions.length,
    totalMessages: sessions.reduce((sum, s) => sum + s.messages.length, 0),
    totalWords: sessions.reduce((sum, s) => sum + s.wordCount, 0),
    avgMessagesPerSession: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + s.messages.length, 0) / sessions.length) 
      : 0,
    oldestSession: sessions.length > 0
      ? new Date(Math.min(...sessions.map(s => s.lastActivity)))
      : null
  }
}

/**
 * Format conversation history for AI prompt
 */
export function formatHistoryForPrompt(history, maxEntries = 5) {
  if (!history || history.length === 0) {
    return ''
  }
  
  const recentHistory = history.slice(-maxEntries)
  
  return recentHistory
    .map(msg => {
      const role = msg.role === 'user' ? 'Student' : 'Assistant'
      return `${role}: ${msg.content}`
    })
    .join('\n')
}

/**
 * Check if conversation needs context refresh
 */
export function needsContextRefresh(userId, pdfId) {
  const session = sessionMemory.get(getSessionKey(userId, pdfId))
  
  if (!session) return true
  
  // Refresh if:
  // 1. Session is older than 30 minutes
  // 2. No messages in session
  // 3. Last activity was more than 10 minutes ago
  
  const now = Date.now()
  const timeSinceActivity = now - session.lastActivity
  
  return (
    session.messages.length === 0 ||
    timeSinceActivity > 10 * 60 * 1000
  )
}

// Start cleanup interval
setInterval(cleanupExpiredSessions, CONFIG.CLEANUP_INTERVAL)

export default {
  getSessionMemory,
  addToMemory,
  getConversationHistory,
  getRecentMessages,
  loadMemoryFromDatabase,
  clearMemory,
  clearUserMemory,
  getMemoryStats,
  getConversationSummary,
  getActiveSessionsCount,
  getMemoryUsageInfo,
  formatHistoryForPrompt,
  needsContextRefresh,
  CONFIG
}
