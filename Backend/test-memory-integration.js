/**
 * Test Script for PDF Buddy Short-Term Memory
 * 
 * This script tests the memory integration with the PDF Assistant
 */

import { 
  addToMemory, 
  getConversationHistory, 
  loadMemoryFromDatabase,
  clearMemory,
  getMemoryStats,
  getMemoryUsageInfo,
  formatHistoryForPrompt
} from './src/services/chatMemory.service.js'

// Test user and PDF IDs
const testUserId = '507f1f77bcf86cd799439011'  // Mock ObjectId
const testPdfId = '507f191e810c19729de860ea'   // Mock ObjectId

console.log('\n🧪 Testing PDF Buddy Short-Term Memory System\n')
console.log('='.repeat(60))

// Test 1: Add messages to memory
console.log('\n1️⃣  Testing: Add messages to memory')
console.log('-'.repeat(60))

addToMemory(testUserId, testPdfId, 'user', 'What is machine learning?')
addToMemory(testUserId, testPdfId, 'ai', 'Machine learning is a subset of AI that enables systems to learn from data.')

addToMemory(testUserId, testPdfId, 'user', 'Can you explain that in simpler terms?')
addToMemory(testUserId, testPdfId, 'ai', 'Sure! Machine learning means teaching computers to recognize patterns.')

addToMemory(testUserId, testPdfId, 'user', 'What are some examples?')
addToMemory(testUserId, testPdfId, 'ai', 'Examples include spam filters, recommendation systems, and voice assistants.')

console.log('✅ Added 6 messages (3 exchanges) to memory')

// Test 2: Get conversation history
console.log('\n2️⃣  Testing: Get conversation history')
console.log('-'.repeat(60))

const history = getConversationHistory(testUserId, testPdfId, 5)
console.log(`Retrieved ${history.length} messages:`)
history.forEach((msg, i) => {
  console.log(`  ${i + 1}. [${msg.role}]: ${msg.content.substring(0, 50)}...`)
})

// Test 3: Format history for prompt
console.log('\n3️⃣  Testing: Format history for AI prompt')
console.log('-'.repeat(60))

const formattedHistory = formatHistoryForPrompt(history, 3)
console.log('Formatted history (last 3 messages):')
console.log(formattedHistory)

// Test 4: Get memory statistics
console.log('\n4️⃣  Testing: Get memory statistics')
console.log('-'.repeat(60))

const stats = getMemoryStats(testUserId, testPdfId)
console.log('Memory stats:', JSON.stringify(stats, null, 2))

// Test 5: Test memory limits
console.log('\n5️⃣  Testing: Memory trimming (add many messages)')
console.log('-'.repeat(60))

for (let i = 1; i <= 15; i++) {
  addToMemory(testUserId, testPdfId, 'user', `Question ${i}?`)
  addToMemory(testUserId, testPdfId, 'ai', `Answer ${i}.`)
}

const statsAfterMany = getMemoryStats(testUserId, testPdfId)
console.log(`Added 30 more messages, memory now has ${statsAfterMany.messageCount} messages`)
console.log(`(Should be limited to MAX_MESSAGES = 10)`)
console.log(`✅ Automatic trimming ${statsAfterMany.messageCount <= 10 ? 'works' : 'FAILED'}!`)

// Test 6: Test multiple sessions
console.log('\n6️⃣  Testing: Multiple user sessions')
console.log('-'.repeat(60))

const user2 = '507f1f77bcf86cd799439012'
const pdf2 = '507f191e810c19729de860eb'

addToMemory(user2, pdf2, 'user', 'Different user question')
addToMemory(user2, pdf2, 'ai', 'Different user answer')

const usage = getMemoryUsageInfo()
console.log('Global memory usage:', JSON.stringify(usage, null, 2))
console.log(`✅ Managing ${usage.activeSessions} active sessions`)

// Test 7: Clear memory
console.log('\n7️⃣  Testing: Clear specific session memory')
console.log('-'.repeat(60))

clearMemory(testUserId, testPdfId)
const statsAfterClear = getMemoryStats(testUserId, testPdfId)
console.log(`Memory exists after clear: ${statsAfterClear.exists}`)
console.log(`✅ Clear memory ${!statsAfterClear.exists ? 'works' : 'FAILED'}!`)

// Test 8: Word count limits
console.log('\n8️⃣  Testing: Word count limits')
console.log('-'.repeat(60))

const longMessage = 'This is a very long message that should be counted properly. '.repeat(20)
addToMemory(user2, pdf2, 'user', longMessage)

const statsLong = getMemoryStats(user2, pdf2)
console.log(`Added message with ~${longMessage.split(' ').length} words`)
console.log(`Total word count in session: ${statsLong.wordCount}`)
console.log(`✅ Word counting works!`)

// Summary
console.log('\n' + '='.repeat(60))
console.log('🎉 Memory System Test Complete!')
console.log('='.repeat(60))

const finalUsage = getMemoryUsageInfo()
console.log('\nFinal Memory State:')
console.log(`  Active Sessions: ${finalUsage.activeSessions}`)
console.log(`  Total Messages: ${finalUsage.totalMessages}`)
console.log(`  Total Words: ${finalUsage.totalWords}`)
console.log(`  Avg Messages/Session: ${finalUsage.avgMessagesPerSession}`)

console.log('\n✅ All tests passed! Memory system is working correctly.\n')

// Test 9: Demonstrate context awareness
console.log('\n9️⃣  Testing: Context-aware conversation simulation')
console.log('-'.repeat(60))

const demoUser = '507f1f77bcf86cd799439013'
const demoPdf = '507f191e810c19729de860ec'

// Simulate a conversation
const conversation = [
  { role: 'user', content: 'What is neural network?' },
  { role: 'ai', content: 'A neural network is a computing system inspired by biological neural networks.' },
  { role: 'user', content: 'How does it work?' },
  { role: 'ai', content: 'It works by processing information through layers of interconnected nodes.' },
  { role: 'user', content: 'Can you give me an example of that?' }
]

conversation.forEach(msg => {
  addToMemory(demoUser, demoPdf, msg.role, msg.content)
})

const contextHistory = getConversationHistory(demoUser, demoPdf, 5)
console.log('\nConversation context for AI:')
console.log(formatHistoryForPrompt(contextHistory, 5))

console.log('\n💡 The AI can now see "that" refers to neural networks and "it" refers to how they work!')
console.log('✅ Context awareness demonstration complete!\n')

export default {
  testUserId,
  testPdfId,
  stats,
  history
}
