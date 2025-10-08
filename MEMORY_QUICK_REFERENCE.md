# PDF Buddy Memory - Quick Reference 🚀

## For Developers

### Import Memory Functions
```javascript
import { 
  addToMemory,
  getConversationHistory,
  loadMemoryFromDatabase,
  getMemoryStats,
  clearMemory
} from './services/chatMemory.service.js'
```

### Add Message to Memory
```javascript
addToMemory(userId, pdfId, 'user', 'What is AI?')
addToMemory(userId, pdfId, 'ai', 'AI stands for Artificial Intelligence...')
```

### Get Conversation History
```javascript
const history = getConversationHistory(userId, pdfId, 5) // Last 5 messages
// Returns: [{ role: 'user', content: '...' }, { role: 'ai', content: '...' }]
```

### Load from Database
```javascript
await loadMemoryFromDatabase(userId, pdfId)
```

### Get Memory Stats
```javascript
const stats = getMemoryStats(userId, pdfId)
console.log(stats.messageCount) // Number of messages
console.log(stats.wordCount)    // Total word count
```

### Clear Memory
```javascript
clearMemory(userId, pdfId) // Clear specific session
clearUserMemory(userId)    // Clear all user sessions
```

---

## Usage in Services

### PDF Assistant Service
```javascript
// In generateResponse() or generateStreamingResponse()
export async function generateResponse({ question, pdfId, userId }) {
  // Load memory if needed
  if (userId && needsContextRefresh(userId, pdfId)) {
    await loadMemoryFromDatabase(userId, pdfId)
  }
  
  // Get conversation history
  const history = userId 
    ? getConversationHistory(userId, pdfId, 5)
    : []
  
  // Add user message
  if (userId) {
    addToMemory(userId, pdfId, 'user', question)
  }
  
  // Generate response with context
  const prompt = buildAssistantPrompt(question, pdfContext, history)
  const response = await client.generate({ prompt })
  
  // Add AI response
  if (userId) {
    addToMemory(userId, pdfId, 'ai', response.text)
  }
  
  return { success: true, response: response.text }
}
```

---

## Usage in Routes

### REST API
```javascript
router.post('/send', requireAuth, async (req, res) => {
  const { content, pdfId } = req.body
  
  const result = await generateResponse({
    question: content,
    pdfId,
    userId: req.user._id  // Pass userId for memory
  })
  
  // Memory is automatically managed
  res.json({ response: result.response })
})
```

### Socket.IO
```javascript
socket.on('chat-message', async ({ content, pdfId }) => {
  const result = await generateStreamingResponse({
    question: content,
    pdfId,
    userId: socket.user._id,  // Pass userId for memory
    onChunk: (chunk) => socket.emit('ai-response-chunk', { chunk })
  })
})

socket.on('join-pdf', async ({ pdfId }) => {
  // Load memory on join
  await loadMemoryFromDatabase(socket.user._id, pdfId)
  
  // Send stats to client
  const stats = getMemoryStats(socket.user._id, pdfId)
  socket.emit('memory-loaded', stats)
})
```

---

## Configuration

### Adjust Memory Limits
```javascript
// In chatMemory.service.js
const CONFIG = {
  MAX_MESSAGES: 10,              // Change to 20 for more context
  MAX_WORDS: 1500,               // Change to 3000 for longer conversations
  SESSION_TIMEOUT: 30 * 60 * 1000, // Change to 60 minutes
}
```

---

## Testing

### Quick Test
```bash
cd Backend
node test-memory-integration.js
```

### Manual Test
```javascript
// Add some messages
addToMemory('user123', 'pdf456', 'user', 'Hello')
addToMemory('user123', 'pdf456', 'ai', 'Hi there!')

// Get history
const history = getConversationHistory('user123', 'pdf456')
console.log(history) // [{ role: 'user', content: 'Hello' }, ...]

// Check stats
const stats = getMemoryStats('user123', 'pdf456')
console.log(stats) // { messageCount: 2, wordCount: 3, ... }
```

---

## Monitoring

### Check Active Sessions
```javascript
import { getActiveSessionsCount, getMemoryUsageInfo } from './services/chatMemory.service.js'

console.log('Active sessions:', getActiveSessionsCount())

const usage = getMemoryUsageInfo()
console.log('Total messages:', usage.totalMessages)
console.log('Total words:', usage.totalWords)
```

### Add Logging
```javascript
// After adding to memory
const stats = getMemoryStats(userId, pdfId)
console.log(`💾 Memory: ${stats.messageCount} msgs, ${stats.wordCount} words`)
```

---

## Best Practices

### ✅ Do
- Always pass `userId` when available
- Load memory on session start
- Check `needsContextRefresh()` before loading
- Use `formatHistoryForPrompt()` for AI prompts
- Monitor memory usage in production

### ❌ Don't
- Don't load memory on every message (check refresh first)
- Don't exceed MAX_MESSAGES limit manually
- Don't forget to handle missing userId gracefully
- Don't modify CONFIG without testing

---

## Common Patterns

### Pattern 1: Generate with Memory
```javascript
async function generateWithMemory(userId, pdfId, question) {
  // Load if needed
  if (needsContextRefresh(userId, pdfId)) {
    await loadMemoryFromDatabase(userId, pdfId)
  }
  
  // Add user message
  addToMemory(userId, pdfId, 'user', question)
  
  // Get history and generate
  const history = getConversationHistory(userId, pdfId)
  const response = await generateAIResponse(question, history)
  
  // Add AI response
  addToMemory(userId, pdfId, 'ai', response)
  
  return response
}
```

### Pattern 2: Session Initialization
```javascript
async function initializeChatSession(userId, pdfId) {
  // Load memory from database
  await loadMemoryFromDatabase(userId, pdfId)
  
  // Get and return stats
  const stats = getMemoryStats(userId, pdfId)
  
  return {
    ready: true,
    messageCount: stats.messageCount,
    wordCount: stats.wordCount
  }
}
```

### Pattern 3: Clear on Logout
```javascript
function handleUserLogout(userId) {
  // Clear all user sessions
  const cleared = clearUserMemory(userId)
  console.log(`Cleared ${cleared} sessions for user ${userId}`)
}
```

---

## Debugging

### Debug Memory State
```javascript
const stats = getMemoryStats(userId, pdfId)
console.log('Memory Debug:', JSON.stringify(stats, null, 2))
```

### Debug Conversation History
```javascript
const history = getConversationHistory(userId, pdfId)
console.log('Conversation History:')
history.forEach((msg, i) => {
  console.log(`${i + 1}. [${msg.role}]: ${msg.content}`)
})
```

### Debug Memory Usage
```javascript
const usage = getMemoryUsageInfo()
console.log('Memory Usage:', JSON.stringify(usage, null, 2))
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Memory not persisting | Ensure userId is passed to functions |
| Too much memory used | Reduce MAX_MESSAGES or MAX_WORDS |
| Context lost | Check SESSION_TIMEOUT (30 min default) |
| Slow performance | Memory should be fast; check database queries |

---

## Reference Links

- Full Documentation: `PDF_BUDDY_SHORT_TERM_MEMORY.md`
- Implementation Summary: `MEMORY_IMPLEMENTATION_SUMMARY.md`
- Test Script: `Backend/test-memory-integration.js`
- Source Code: `Backend/src/services/chatMemory.service.js`

---

**Quick Reference Version**: 1.0  
**Last Updated**: October 9, 2025  
**Status**: ✅ Ready to Use
