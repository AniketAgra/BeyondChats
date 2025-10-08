# PDF Buddy Short-Term Memory System 🧠

## Overview

The PDF Buddy chat system now includes intelligent **short-term memory** functionality that enables contextual, conversation-aware responses similar to ChatGPT. The AI can remember recent exchanges and provide relevant follow-up answers.

## Key Features

### 1. **Automatic Context Management** 📝
- Maintains last 10 messages (5 exchanges) in active memory
- Automatically loads conversation history from database when needed
- Limits memory to 1,500 words to maintain performance
- Cleans up expired sessions automatically (30-minute timeout)

### 2. **Smart Context Usage** 🎯
- AI understands references like "it", "that", "the previous answer"
- Provides follow-up responses based on conversation flow
- Tracks topics discussed during the session
- Seamlessly integrates with PDF content

### 3. **Memory Lifecycle** ⏱️
- **Load**: Automatically loaded when user joins a PDF chat
- **Store**: Messages saved to both memory cache and database
- **Trim**: Old messages removed when limits exceeded
- **Expire**: Sessions cleared after 30 minutes of inactivity
- **Cleanup**: Automatic cleanup runs every 5 minutes

## How It Works

### Memory Flow
```
User Message → Add to Memory → Retrieve Context → Generate AI Response → Add to Memory → Database Save
```

### Session Management
- Each user-PDF combination has a unique memory session
- Memory persists across page refreshes (loaded from database)
- Active sessions kept in RAM for fast access
- Expired sessions automatically cleaned up

## Configuration

Located in `Backend/src/services/chatMemory.service.js`:

```javascript
const CONFIG = {
  MAX_MESSAGES: 10,              // Maximum messages (5 exchanges)
  MAX_WORDS: 1500,               // Maximum total words in context
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  CLEANUP_INTERVAL: 5 * 60 * 1000,  // 5 minutes
  SUMMARIZE_THRESHOLD: 8         // Future: Auto-summarize threshold
}
```

## API Integration

### REST API (`/api/chat/send`)
```javascript
POST /api/chat/send
{
  "content": "What did you say about that?",
  "pdfId": "...",
  "conversationHistory": [] // Optional, will use memory if userId provided
}

Response includes:
{
  "memoryUsed": true,  // Indicates if memory was used
  "hasContext": true   // Indicates if PDF context was used
}
```

### Socket.IO (Streaming)
```javascript
// Client connects
socket.emit('join-pdf', { pdfId: '...' })

// Server loads memory and responds
socket.on('memory-loaded', (stats) => {
  console.log('Messages in memory:', stats.messageCount)
  console.log('Total words:', stats.wordCount)
})

// Send message with automatic memory integration
socket.emit('chat-message', { 
  content: 'Tell me more about that',
  pdfId: '...'
})

// AI response uses memory for context
socket.on('ai-response-complete', (data) => {
  console.log('Memory used:', data.memoryUsed)
})
```

## Example Conversations

### Without Memory (Old Behavior)
```
User: What is machine learning?
AI: Machine learning is a subset of AI that enables systems to learn...

User: Can you explain that in simpler terms?
AI: I'm not sure what you're referring to. Could you be more specific?
❌ No context retention
```

### With Memory (New Behavior)
```
User: What is machine learning?
AI: Machine learning is a subset of AI that enables systems to learn...

User: Can you explain that in simpler terms?
AI: Sure! Machine learning means teaching computers to learn patterns...
✅ Understands "that" refers to machine learning
```

## Memory Statistics API

### Get Memory Stats
```javascript
import { getMemoryStats } from './services/chatMemory.service.js'

const stats = getMemoryStats(userId, pdfId)
console.log(stats)
// {
//   exists: true,
//   messageCount: 6,
//   wordCount: 450,
//   lastActivity: Date,
//   oldestMessage: Date,
//   newestMessage: Date
// }
```

### Get Global Memory Usage
```javascript
import { getMemoryUsageInfo } from './services/chatMemory.service.js'

const info = getMemoryUsageInfo()
console.log(info)
// {
//   activeSessions: 15,
//   totalMessages: 120,
//   totalWords: 12500,
//   avgMessagesPerSession: 8,
//   oldestSession: Date
// }
```

## Technical Implementation

### Files Modified

1. **`Backend/src/services/pdfAssistent.service.js`**
   - Added memory service imports
   - Modified `generateResponse()` to use memory
   - Modified `generateStreamingResponse()` to use memory
   - Enhanced prompt building with conversation history
   - Added userId parameter support

2. **`Backend/src/routes/chat.js`**
   - Updated REST endpoint to pass userId
   - Added `memoryUsed` flag to response metadata

3. **`Backend/src/sockets/chatSocket.js`**
   - Already integrated with memory service
   - Passes userId to streaming responses
   - Emits memory statistics on join

4. **`Backend/src/services/chatMemory.service.js`**
   - Complete memory management service (already existed)
   - Provides all memory operations

### Memory Service Functions

#### Core Operations
- `addToMemory(userId, pdfId, role, content)` - Add message to memory
- `getConversationHistory(userId, pdfId, maxMessages)` - Get context for AI
- `loadMemoryFromDatabase(userId, pdfId)` - Load from database
- `clearMemory(userId, pdfId)` - Clear specific session
- `clearUserMemory(userId)` - Clear all user sessions

#### Utility Functions
- `getMemoryStats(userId, pdfId)` - Get session statistics
- `getMemoryUsageInfo()` - Get global memory info
- `formatHistoryForPrompt(history, maxEntries)` - Format for AI
- `needsContextRefresh(userId, pdfId)` - Check if reload needed

## Performance Optimizations

### 1. **In-Memory Cache**
- Active sessions stored in RAM Map
- Instant access without database queries
- Automatic cleanup prevents memory leaks

### 2. **Smart Trimming**
- Removes oldest messages when limits exceeded
- Maintains minimum of 2 messages (1 exchange)
- Word-based limiting prevents token overflow

### 3. **Lazy Loading**
- Memory loaded only when needed
- Checks if refresh required before loading
- Reduces unnecessary database queries

### 4. **Automatic Cleanup**
- Background task runs every 5 minutes
- Removes sessions inactive > 30 minutes
- Logs cleanup activity for monitoring

## Benefits for Users

### 1. **Natural Conversations** 💬
- Ask follow-up questions naturally
- Refer to previous answers with "it", "that", etc.
- Build on previous context

### 2. **Better Understanding** 🎓
- AI remembers what was discussed
- Provides more relevant responses
- Reduces need to repeat context

### 3. **Efficient Learning** ⚡
- Quick clarifications without re-explaining
- Smooth conversation flow
- Focus on learning, not repeating

## Future Enhancements

### Planned Features
1. **Conversation Summarization** - Auto-summarize long conversations
2. **Topic Tracking** - Identify and track discussed topics
3. **Smart Memory** - Keep important messages longer
4. **Cross-PDF Memory** - Remember context across PDFs
5. **Memory Export** - Export conversation history

### Possible Improvements
- Increase context window for paid users
- Add memory preferences (short/medium/long)
- Implement conversation threading
- Add memory search functionality

## Monitoring & Debugging

### Check Active Sessions
```javascript
import { getActiveSessionsCount } from './services/chatMemory.service.js'
console.log('Active sessions:', getActiveSessionsCount())
```

### Monitor Memory Usage
```javascript
import { getMemoryUsageInfo } from './services/chatMemory.service.js'
setInterval(() => {
  console.log('Memory info:', getMemoryUsageInfo())
}, 60000) // Every minute
```

### Debug Session
```javascript
import { getMemoryStats } from './services/chatMemory.service.js'
const stats = getMemoryStats(userId, pdfId)
console.log('Session debug:', JSON.stringify(stats, null, 2))
```

## Troubleshooting

### Issue: Memory not working
**Solution**: Ensure userId is passed to `generateResponse()` or `generateStreamingResponse()`

### Issue: Context not maintained
**Solution**: Check if session timeout (30 min) has expired. Memory auto-clears after inactivity.

### Issue: Responses too slow
**Solution**: Reduce `MAX_MESSAGES` or `MAX_WORDS` in config if memory operations are slow.

### Issue: Memory leaks
**Solution**: Automatic cleanup should prevent this. Check cleanup interval is running.

## Testing

### Manual Testing
1. Start chat session with PDF
2. Ask a question
3. Ask follow-up using "that", "it", "the previous"
4. Verify AI understands context
5. Wait 30+ minutes, verify session expires

### Check Memory Stats
```bash
# In socket event or route
socket.emit('join-pdf', { pdfId: '...' })
socket.on('memory-loaded', stats => {
  console.log('Memory loaded:', stats)
})
```

## Conclusion

The short-term memory system transforms PDF Buddy from a simple Q&A bot into an intelligent conversational assistant that maintains context, understands follow-ups, and provides a natural ChatGPT-like experience. 🎉

The system is designed to be:
- ✅ **Efficient** - Smart caching and cleanup
- ✅ **Reliable** - Database persistence with memory cache
- ✅ **Scalable** - Per-user session isolation
- ✅ **Maintainable** - Clean service architecture
- ✅ **User-friendly** - Transparent and automatic

---

**Last Updated**: October 9, 2025  
**Version**: 1.0  
**Status**: ✅ Fully Implemented
