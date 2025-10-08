# 🚀 AI Study Buddy - Complete RAG System with Chat Management

## 📋 Overview

This document describes the complete implementation of the dual AI system with Pinecone-powered RAG (Retrieval-Augmented Generation). The system includes:

1. **Chat Sidebar** - Organize conversations into PDF-specific and general AI Study Buddy chats
2. **Separate Chat Contexts** - PDF chats stay isolated; AI Study Buddy has full memory
3. **Pinecone Integration** - Vector database for intelligent context retrieval
4. **Performance-Aware AI** - Uses quiz scores and weak topics to personalize responses

---

## 🎯 System Architecture

### Two Chat Types

#### 1. **PDF-Specific Chats** (Type: `pdf`)
- **Context**: Limited to one PDF document
- **Memory**: Conversation history within that PDF
- **RAG Source**: PDF chunks from `userId/pdfId` namespace
- **Performance Data**: Quiz scores specific to that PDF
- **Use Case**: Deep-dive into specific document content

#### 2. **General AI Study Buddy Chats** (Type: `general`)
- **Context**: All user's study materials
- **Memory**: Cross-PDF learning patterns via Pinecone
- **RAG Source**: `userId/quiz_context` namespace + all PDFs
- **Performance Data**: Overall quiz performance, weak topics
- **Use Case**: Personalized tutoring, study planning, concept explanations

---

## 🗄️ Database Schema

### ChatSession Model
```javascript
{
  user: ObjectId,              // User reference
  title: String,               // "New Chat", "Physics Chapter 3", etc.
  type: 'pdf' | 'general',     // Chat type
  pdfId: ObjectId,             // Required if type === 'pdf'
  lastMessageAt: Date,         // For sorting
  messageCount: Number,        // Total messages
  isActive: Boolean,           // Soft delete
  
  context: {
    topics: [String],          // Topics discussed
    weakTopics: [String],      // From quiz performance
    quizPerformance: {
      totalAttempts: Number,
      averageScore: Number,
      weakAreas: [String]
    }
  },
  
  meta: {
    pdfTitle: String,
    sessionType: String,
    tags: [String]
  }
}
```

### SessionMessage Model
```javascript
{
  sessionId: ObjectId,         // Parent session
  user: ObjectId,
  role: 'user' | 'ai' | 'system',
  content: String,             // Message text
  
  meta: {
    aiGenerated: Boolean,
    hasContext: Boolean,
    memoryUsed: Boolean,
    ragUsed: Boolean,
    
    sources: [{
      type: 'pdf' | 'quiz' | 'note' | 'memory',
      id: String,
      relevance: Number,
      excerpt: String
    }],
    
    performanceContext: {
      quizScore: Number,
      weakTopics: [String],
      studyTime: Number
    },
    
    vectorSearch: {
      query: String,
      topMatches: Number,
      namespace: String
    }
  }
}
```

---

## 🔧 Backend Implementation

### Files Created/Modified

#### 1. **Schemas**
- `src/schemas/ChatSession.js` - Session management
- `src/schemas/SessionMessage.js` - Messages within sessions

#### 2. **Services**
- `src/services/aiStudyBuddy.service.js` - Core AI logic
- `src/services/vector.service.js` - Pinecone operations
- `src/config/pinecone.js` - Pinecone client initialization

#### 3. **Routes**
- `src/routes/aibuddy.js` - REST API endpoints

#### 4. **Configuration**
- `.env.example` - Added Pinecone environment variables

### API Endpoints

#### Sessions Management

**GET /api/ai-buddy/sessions**
```javascript
Query: { type?: 'pdf' | 'general' }
Response: { sessions: ChatSession[] }
```

**POST /api/ai-buddy/sessions**
```javascript
Body: { type: 'pdf' | 'general', pdfId?: string, title?: string }
Response: { session: ChatSession }
```

**GET /api/ai-buddy/sessions/:sessionId/messages**
```javascript
Query: { limit?: number }
Response: { messages: SessionMessage[] }
```

**POST /api/ai-buddy/sessions/:sessionId/messages**
```javascript
Body: { content: string, useRAG?: boolean }
Response: { messages: [SessionMessage, SessionMessage] }
```

**PATCH /api/ai-buddy/sessions/:sessionId**
```javascript
Body: { title: string }
Response: { session: ChatSession }
```

**DELETE /api/ai-buddy/sessions/:sessionId**
```javascript
Response: { message: 'Session deleted successfully' }
```

---

## 🌐 Pinecone Integration

### Namespaces Structure

```
├── {userId}/{pdfId}              # PDF-specific embeddings
│   ├── chunk_0                   # PDF text chunks
│   ├── chunk_1
│   └── ...
│
├── {userId}/quiz_context         # User's learning performance
│   ├── quiz_{quizId}             # Quiz performance vectors
│   └── ...
│
└── {userId}/memory               # General conversation memory
    └── ...
```

### Vector Metadata

**PDF Chunks:**
```javascript
{
  userId: string,
  pdfId: string,
  chunkIndex: number,
  text: string,
  chapter: string,
  pageNumber: number,
  type: 'pdf_chunk'
}
```

**Quiz Context:**
```javascript
{
  userId: string,
  quizId: string,
  topics: [string],
  weakTopics: [string],
  score: number,
  timestamp: string,
  type: 'quiz_performance'
}
```

### Key Functions

**storePDFEmbeddings(userId, pdfId, chunks)**
- Generates embeddings for PDF chunks
- Stores in `userId/pdfId` namespace

**storeQuizContext(userId, quizData)**
- Creates embedding from quiz performance
- Stores in `userId/quiz_context` namespace

**querySimilarVectors(query, namespace, topK)**
- Searches for similar content
- Returns top K matches with metadata

**getUserLearningContext(userId, query)**
- Retrieves user's overall learning patterns
- Used by general AI Study Buddy

---

## 🎨 Frontend Implementation

### Components

#### ChatSidebar (`components/ChatSidebar/ChatSidebar.jsx`)

**Features:**
- Lists all chat sessions
- Separates PDF chats from general chats
- Inline editing of chat titles
- Delete confirmation
- Real-time updates

**Props:**
```javascript
{
  sessions: Array,
  activeSessionId: string,
  onSelectSession: (id) => void,
  onCreateSession: (type) => void,
  onDeleteSession: (id) => void,
  onRenameSession: (id, title) => void
}
```

#### Updated AIBuddyPage (`pages/AIBuddyPage.jsx`)

**New State:**
```javascript
- sessions[]              // All chat sessions
- activeSessionId         // Currently selected
- sidebarOpen            // Sidebar visibility
```

**New Functions:**
```javascript
- loadSessions()          // Fetch all sessions
- loadMessages(id)        // Load session messages
- handleCreateSession()   // New chat
- handleSelectSession()   // Switch chats
- handleDeleteSession()   // Remove chat
- handleRenameSession()   // Edit title
```

### API Service (`utils/api.js`)

**New aiBuddyApi:**
```javascript
{
  getSessions(type?),
  createSession(type, pdfId?, title?),
  getMessages(sessionId, limit?),
  sendMessage(sessionId, content, useRAG?),
  updateSession(sessionId, title),
  deleteSession(sessionId)
}
```

---

## 🔄 User Workflows

### Workflow 1: General Study Help
1. User opens `/aibuddy`
2. Clicks "New Chat" button
3. Creates general AI Study Buddy chat
4. Asks: "What are my weak topics?"
5. AI queries Pinecone `userId/quiz_context`
6. Returns personalized list with improvement suggestions

### Workflow 2: PDF-Specific Deep Dive
1. User has uploaded "Physics_XII.pdf"
2. From PDF viewer, clicks AI buddy icon
3. Creates PDF-specific chat session
4. Asks: "Explain electromagnetic induction"
5. AI queries `userId/pdfId` namespace
6. Returns context from that PDF only
7. Uses quiz performance on that PDF

### Workflow 3: Weak Topic Learning
1. Dashboard shows "Quantum Physics" as weak (45% score)
2. User clicks "Learn More"
3. Redirects to `/aibuddy?topic=Quantum Physics`
4. Auto-creates new general chat
5. Auto-sends topic query
6. AI provides comprehensive explanation using all sources

### Workflow 4: Chat Management
1. User has 5+ chats
2. Sidebar shows:
   - 3 General Study Buddy chats
   - 2 PDF-specific chats
3. Can rename: "Physics Help" → "EM Induction Study"
4. Can delete old chats
5. Switches between chats instantly

---

## 🔐 Environment Variables

Add to `.env`:

```bash
# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=edulearn-vectors

# OpenAI (for embeddings and LLM)
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 📦 Dependencies to Install

### Backend
```bash
npm install @pinecone-database/pinecone
```

### Frontend
```bash
# Already installed:
# - react-icons (for UI icons)
```

---

## 🎯 How AI Buddy Uses Performance Data

### For PDF Chats:
```javascript
// Gets quiz attempts for specific PDF
const quizPerformance = await QuizAttempt.find({
  user: userId,
  pdfId: pdfId,
  submittedAt: { $exists: true }
})

// If score < 70%, AI adapts:
"I notice you scored 62% on this topic. Let me break it down further..."
```

### For General AI Study Buddy:
```javascript
// Gets overall performance
const performance = await getUserPerformanceContext(userId)
// Returns:
{
  totalAttempts: 15,
  averageScore: 68,
  weakAreas: ['Electromagnetic Induction', 'Quantum Physics']
}

// AI uses this to:
- Prioritize explanations for weak topics
- Suggest study plans
- Adapt teaching difficulty
```

---

## 🚀 RAG Query Flow

### Example: "Explain Ohm's Law"

**Step 1: User sends message**
```
sessionId: "abc123"
content: "Explain Ohm's Law"
```

**Step 2: System determines context**
```javascript
if (session.type === 'pdf') {
  namespace = `${userId}/${pdfId}`  // PDF-specific
} else {
  namespace = `${userId}/quiz_context`  // General
}
```

**Step 3: Query Pinecone**
```javascript
const matches = await querySimilarVectors(
  "Explain Ohm's Law",
  namespace,
  5  // top 5 results
)
```

**Step 4: Build context**
```javascript
context = matches.map(m => m.metadata.text).join('\n\n')
performance = await getUserPerformanceContext(userId)
```

**Step 5: Generate AI response**
```javascript
prompt = `
You are an AI Study Buddy.
Student's weak topics: ${performance.weakAreas.join(', ')}
Average score: ${performance.averageScore}%

Relevant content:
${context}

Student asks: Explain Ohm's Law
`
```

**Step 6: Return formatted response**
```javascript
{
  content: "Ohm's Law states that V = IR...",
  meta: {
    ragUsed: true,
    sources: [
      { type: 'pdf', excerpt: '...' },
      { type: 'quiz', relevance: 0.85 }
    ],
    performanceContext: {
      quizScore: 62,
      weakTopics: ['Electricity']
    }
  }
}
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Create general chat session
- [ ] Create PDF-specific chat session
- [ ] Send message in general chat
- [ ] Send message in PDF chat
- [ ] Verify RAG context is fetched
- [ ] Verify performance data is included
- [ ] Update session title
- [ ] Delete session
- [ ] Pinecone embeddings stored correctly

### Frontend Tests
- [ ] Sidebar displays sessions
- [ ] Can create new chat
- [ ] Can switch between chats
- [ ] Messages load correctly
- [ ] Can send messages
- [ ] Typing indicator works
- [ ] Can rename sessions
- [ ] Can delete sessions
- [ ] URL topic parameter works
- [ ] Responsive on mobile

---

## 📊 Performance Considerations

### Optimization Strategies

**1. Lazy Loading**
- Load only active session messages
- Paginate chat history
- Virtual scrolling for long conversations

**2. Caching**
- Cache Pinecone query results (5 min)
- Cache user performance context
- Local storage for recent sessions

**3. Rate Limiting**
- Max 10 messages per minute
- Debounce typing indicators
- Queue concurrent requests

**4. Vector Search**
- Limit top K to 5-10 results
- Use metadata filters to narrow search
- Cache embeddings for common queries

---

## 🎓 Best Practices

### For Users
1. **Use Descriptive Titles**: Rename chats for easy identification
2. **Separate Concerns**: Use PDF chats for document-specific questions
3. **Use General Chat**: For cross-topic learning and study planning
4. **Regular Cleanup**: Delete old/unused chats

### For Developers
1. **Monitor Token Usage**: Track OpenAI API costs
2. **Optimize Embeddings**: Batch embed operations
3. **Error Handling**: Graceful degradation if Pinecone fails
4. **Logging**: Track RAG performance and relevance scores
5. **Security**: Ensure namespace isolation between users

---

## 🐛 Troubleshooting

### Issue: Sidebar not showing
**Solution:** Check `sidebarOpen` state, verify CSS classes

### Issue: Messages not loading
**Solution:** Verify `activeSessionId`, check API response

### Issue: RAG not working
**Solution:** 
- Check Pinecone API key in `.env`
- Verify index name matches
- Check namespace format

### Issue: Performance data missing
**Solution:**
- Ensure quizzes have been submitted
- Check `QuizAttempt` schema
- Verify user ID matches

---

## 🔮 Future Enhancements

1. **Voice Integration**
   - Text-to-speech for AI responses
   - Voice input for questions

2. **Collaborative Learning**
   - Share chat sessions
   - Group study mode

3. **Advanced Analytics**
   - Chat insights dashboard
   - Learning pattern visualization

4. **Smart Suggestions**
   - Proactive topic recommendations
   - Auto-detect struggling areas

5. **Export Features**
   - Export chat as PDF/Markdown
   - Generate study notes from conversations

---

## 📝 Summary

✅ **Completed:**
- Dual chat system (PDF + General)
- Separate contexts and memory
- Pinecone RAG integration
- Performance-aware AI responses
- Chat management sidebar
- Full CRUD operations
- Environment configuration

🔄 **In Progress:**
- Pinecone index creation
- Embedding generation on PDF upload
- Quiz performance vector storage

📅 **Next Steps:**
1. Set up Pinecone account and index
2. Implement PDF embedding pipeline
3. Test RAG queries
4. Monitor performance and optimize

---

**Last Updated:** October 9, 2025  
**Status:** 🎉 Core Implementation Complete  
**Next Milestone:** Production Deployment with Pinecone
