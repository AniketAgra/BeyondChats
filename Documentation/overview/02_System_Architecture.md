# 🏗️ EduLearn - System Architecture

## Overview

EduLearn follows a modern **three-tier architecture** with clear separation between presentation, business logic, and data layers. The system integrates multiple external services for AI, storage, and vector search capabilities.

---

## 🎨 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React)                            │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  Pages: Dashboard | Library | PDF Viewer | Quiz | AI Buddy       │ │
│  │  Components: Navbar | Sidebar | Chat | Modals | Visualizations   │ │
│  │  State: Context API (Auth, Theme) | Local State (React Hooks)    │ │
│  │  Routing: React Router | Socket.IO Client | Axios HTTP           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTPS/WebSocket
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Node.js)                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  REST API (Express)         WebSocket (Socket.IO)                 │ │
│  │  • /api/auth                • Real-time chat                      │ │
│  │  • /api/pdf                 • PDF room joins                      │ │
│  │  • /api/quiz                • AI streaming responses              │ │
│  │  • /api/analytics           • Typing indicators                   │ │
│  │  • /api/ai-buddy                                                  │ │
│  │  • /api/notes                                                     │ │
│  │  • /api/chat                                                      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  Middlewares: Auth (JWT) | CORS | Cookie Parser | Multer         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  Services: PDF Parser | Quiz Generator | AI Assistant | Vector   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                        ↕                              ↕
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│     DATA LAYER (MongoDB)         │  │   EXTERNAL SERVICES              │
│  ┌────────────────────────────┐  │  │  ┌────────────────────────────┐ │
│  │  Collections:              │  │  │  │  • Supabase Storage        │ │
│  │  • users                   │  │  │  │    (PDF files)             │ │
│  │  • pdfs                    │  │  │  │                            │ │
│  │  • quizzes                 │  │  │  │  • Pinecone Vector DB      │ │
│  │  • quizAttempts            │  │  │  │    (RAG embeddings)        │ │
│  │  • chatSessions            │  │  │  │                            │ │
│  │  • sessionMessages         │  │  │  │  • Google Gemini API       │ │
│  │  • notes                   │  │  │  │    (AI responses)          │ │
│  │  • topics                  │  │  │  │                            │ │
│  │  • topicPerformance        │  │  │  │  • OpenAI API              │ │
│  │  • keyFeatures             │  │  │  │    (Fallback AI)           │ │
│  └────────────────────────────┘  │  │  └────────────────────────────┘ │
└──────────────────────────────────┘  └──────────────────────────────────┘
```

---

## 🔄 Request Flow Diagrams

### 1. User Authentication Flow

```
User Login Request → POST /api/auth/login
    ↓
Express Router → authController.login()
    ↓
Validate credentials (bcrypt hash comparison)
    ↓
Generate Tokens:
    • Access Token (15min) → Sent in response body
    • Refresh Token (7 days) → Set as httpOnly cookie
    ↓
Return user data + accessToken
    ↓
Frontend stores accessToken in localStorage
    ↓
Subsequent requests include: Authorization: Bearer <accessToken>
    ↓
If accessToken expires → POST /api/auth/refresh
    ↓
Validate refreshToken from cookie → Issue new accessToken
```

### 2. PDF Upload & Processing Flow

```
User uploads PDF file
    ↓
Frontend: multipart/form-data → POST /api/pdf/upload
    ↓
Multer middleware: Store file in memory buffer
    ↓
Backend: pdfController.uploadPdf()
    ↓
Step 1: Upload to Supabase Storage
    • Generate signed URL
    • Store in bucket: edulearn-pdfs
    ↓
Step 2: Extract text using pdf-parse
    ↓
Step 3: Generate AI summary (Gemini)
    ↓
Step 4: Save metadata to MongoDB
    {
      user: ObjectId,
      url: signedURL,
      filename, title, size,
      summary, chapters: [],
      uploadedAt: Date
    }
    ↓
Step 5: Background Processing (async)
    • Generate key features (AI)
    • Store in KeyFeatures collection
    ↓
Return PDF document to frontend
    ↓
Frontend navigates to /pdf/:id
```

### 3. Quiz Generation Flow

```
User clicks "Generate Quiz" → POST /api/quiz/generate
    {
      pdfId: "abc123",
      difficulty: "medium",
      types: ["MCQ", "SAQ"],
      topic: "Physics",
      count: 10
    }
    ↓
Backend: quizService.generateQuiz()
    ↓
Fetch PDF content from MongoDB
    ↓
Build AI prompt:
    "Generate 10 medium difficulty MCQ and SAQ questions
     on Physics from the following content: [summary]"
    ↓
Send to Gemini API
    ↓
Parse AI response into structured questions:
    [
      {
        type: "MCQ",
        question: "...",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A"
      }
    ]
    ↓
Save Quiz document to MongoDB
    {
      user, pdf, difficulty, types, topic,
      questions: [...],
      isActive: true
    }
    ↓
Return questions (without correctAnswer) to frontend
    ↓
User submits answers → POST /api/quiz/submit
    ↓
Backend scores responses
    ↓
Save QuizAttempt + Update TopicPerformance
    ↓
Return results with feedback
```

### 4. AI Study Buddy (RAG) Flow

```
User sends message to AI Study Buddy
    ↓
POST /api/ai-buddy/sessions/:sessionId/messages
    { content: "Explain Newton's Laws", useRAG: true }
    ↓
Backend: aiStudyBuddy.service.js
    ↓
Step 1: Generate embedding for user query (OpenAI)
    ↓
Step 2: Query Pinecone for relevant context
    • Namespace: userId/quiz_context + userId/*
    • Top 5 matches by similarity
    ↓
Step 3: Fetch user's quiz performance
    • Weak topics, average scores, recent attempts
    ↓
Step 4: Build comprehensive prompt:
    "Context: [RAG results]
     User's weak topics: [Momentum, Energy]
     Recent quiz score: 65%
     User question: Explain Newton's Laws
     Provide personalized explanation focusing on weak areas."
    ↓
Step 5: Send to Gemini API (streaming)
    ↓
Step 6: Save user message + AI response to SessionMessages
    ↓
Step 7: Update ChatSession metadata
    • lastMessageAt, messageCount
    • Add topic to context.topics[]
    ↓
Return AI response to frontend (streamed via Socket.IO)
```

### 5. Real-Time Chat (WebSocket) Flow

```
User opens PDF chat → Frontend connects Socket.IO
    ↓
socket.emit('join-pdf', { pdfId: 'abc123' })
    ↓
Backend: chatSocket.js middleware authenticates JWT
    ↓
socket.join(room: 'pdf:abc123')
    ↓
User sends message → socket.emit('chat-message', { content, pdfId })
    ↓
Backend receives event
    ↓
Save user message to ChatMessages
    ↓
socket.emit('message-saved', { message })
    ↓
socket.emit('ai-typing', { isTyping: true })
    ↓
Fetch PDF context + Generate AI response (streaming)
    ↓
For each chunk:
    socket.emit('ai-response-chunk', { chunk })
    ↓
When complete:
    socket.emit('ai-response-complete', { fullResponse })
    ↓
Save AI message to ChatMessages
```

---

## 📦 Component Architecture

### Frontend Structure

```
src/
├── pages/                      # Route-level components
│   ├── DashboardPage.jsx      # Analytics & overview
│   ├── LibraryPage.jsx        # PDF list & upload
│   ├── PDFPage.jsx            # PDF viewer + chat + notes
│   ├── QuizPage.jsx           # Quiz generator & taker
│   ├── QuizzesHistoryPage.jsx # Past attempts
│   ├── AIBuddyPage.jsx        # AI Study Buddy interface
│   ├── LoginPage.jsx          # Authentication
│   └── SignupPage.jsx
│
├── components/
│   ├── Navbar/                # Top navigation
│   ├── Sidebar/               # PDF library sidebar
│   ├── ChatSidebar/           # AI chat sessions list
│   ├── PDFViewer/             # React-PDF viewer
│   ├── ChatPanel/             # AI PDF Buddy chat
│   ├── NotesPanel/            # Text/audio notes
│   ├── RightPanel/            # Tabs for chat/notes/suggestions
│   ├── Quiz/
│   │   ├── QuizGenerator.jsx # Quiz creation form
│   │   ├── QuizTaker.jsx     # Question display
│   │   └── QuizResults.jsx   # Score & feedback
│   ├── Dashboard/
│   │   ├── OverviewCards.jsx # Stats cards
│   │   ├── LearningAnalytics.jsx # Charts
│   │   ├── PDFInsights.jsx   # Table/cards
│   │   └── Recommendations.jsx
│   └── AIBuddy/
│       └── FloatingAIBuddy.jsx # Floating action button
│
├── context/
│   ├── AuthContext.jsx        # JWT auth state
│   └── ThemeContext.jsx       # Light/dark mode
│
├── utils/
│   └── api.js                 # Axios instance & API functions
│
├── hooks/
│   └── useChatSocket.js       # Socket.IO React hook
│
└── theme.css                  # CSS variables
```

### Backend Structure

```
src/
├── app.js                     # Express app configuration
├── server.js                  # HTTP + Socket.IO server
│
├── routes/
│   ├── auth.js               # Login, signup, refresh, logout
│   ├── pdf.js                # Parse, summarize
│   ├── pdfRoutes.js          # Upload, list, get, delete
│   ├── quiz.js               # Generate, submit, attempts
│   ├── analytics.js          # Dashboard data endpoints
│   ├── aibuddy.js            # AI Study Buddy sessions
│   ├── chat.js               # Chat history REST
│   ├── notes.js              # CRUD for notes
│   └── keyFeatures.js        # PDF key points
│
├── controllers/
│   └── pdfController.js      # Business logic for PDFs
│
├── services/
│   ├── pdfService.js         # PDF parsing & summarization
│   ├── quizService.js        # Quiz generation & scoring
│   ├── aiStudyBuddy.service.js # RAG-powered AI
│   ├── pdfAssistant.service.js # PDF chat AI
│   └── vector.service.js     # Pinecone operations
│
├── schemas/                  # MongoDB models
│   ├── User.js
│   ├── Pdf.js
│   ├── Quiz.js
│   ├── QuizAttempt.js
│   ├── ChatSession.js
│   ├── SessionMessage.js
│   ├── ChatMessage.js
│   ├── Note.js
│   ├── Topic.js
│   ├── TopicPerformance.js
│   └── KeyFeatures.js
│
├── middlewares/
│   └── auth.js               # JWT verification
│
├── sockets/
│   └── chatSocket.js         # Socket.IO event handlers
│
└── config/
    ├── db.js                 # MongoDB connection
    ├── supabase.js           # Supabase client
    └── pinecone.js           # Pinecone client
```

---

## 🗄️ Database Schema

### MongoDB Collections

#### users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (bcrypt hashed),
  username: String,
  createdAt: Date
}
```

#### pdfs
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: users),
  url: String,                 // Supabase signed URL
  filename: String,
  title: String,
  author: String,
  size: Number,
  summary: String,             // AI-generated
  chapters: [String],
  imageUrl: String,            // Cover image
  uploadedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### quizzes
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  pdf: ObjectId,
  difficulty: 'easy' | 'medium' | 'hard',
  types: ['MCQ', 'SAQ', 'LAQ'],
  topic: String,
  totalQuestions: Number,
  questions: [
    {
      type: 'MCQ' | 'SAQ' | 'LAQ',
      question: String,
      options: [String],        // For MCQs
      correctAnswer: String,
      explanation: String
    }
  ],
  isActive: Boolean,
  createdAt: Date
}
```

#### quizAttempts
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  quiz: ObjectId,
  pdf: ObjectId,
  topic: String,
  difficulty: String,
  score: Number,               // Percentage
  correct: Number,
  total: Number,
  timeTaken: Number,           // Seconds
  responses: [
    {
      questionIndex: Number,
      userAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean
    }
  ],
  createdAt: Date
}
```

#### chatSessions
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  title: String,
  type: 'pdf' | 'general',
  pdfId: ObjectId,             // If type === 'pdf'
  lastMessageAt: Date,
  messageCount: Number,
  isActive: Boolean,
  context: {
    topics: [String],
    weakTopics: [String],
    quizPerformance: {
      totalAttempts: Number,
      averageScore: Number
    }
  }
}
```

#### sessionMessages
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,
  user: ObjectId,
  role: 'user' | 'ai' | 'system',
  content: String,
  meta: {
    aiGenerated: Boolean,
    hasContext: Boolean,
    ragUsed: Boolean,
    sources: [
      {
        type: 'pdf' | 'quiz' | 'memory',
        id: String,
        relevance: Number
      }
    ]
  },
  createdAt: Date
}
```

### Pinecone Namespaces

```
Index: edulearn-vectors
Dimension: 1536 (OpenAI text-embedding-ada-002)

Namespaces:
├── {userId}/quiz_context        # Quiz performance embeddings
├── {userId}/{pdfId}             # PDF chunk embeddings
└── {userId}/notes               # User notes embeddings
```

---

## 🔐 Security Architecture

### Authentication Flow
1. **Password Hashing**: bcrypt with 10 rounds
2. **JWT Tokens**:
   - Access Token (15min expiry) → localStorage
   - Refresh Token (7 days expiry) → httpOnly cookie
3. **Token Refresh**: Automatic via /api/auth/refresh
4. **Middleware**: requireAuth verifies JWT on protected routes

### API Security
- CORS configured for specific frontend origin
- Rate limiting (future enhancement)
- Input validation on all endpoints
- MongoDB ObjectId validation
- File upload size limits (50MB)

### Data Privacy
- User data isolated by userId
- PDF access verified on every request
- Chat sessions scoped to user
- Supabase URLs signed with expiration

---

## 🚀 Scalability Considerations

### Current Architecture
- Single server deployment
- MongoDB single instance
- Stateful WebSocket connections

### Future Enhancements
- **Horizontal Scaling**: Load balancer + multiple app servers
- **Session Management**: Redis for Socket.IO adapter
- **Caching**: Redis for frequently accessed PDFs
- **CDN**: Static assets via CDN
- **Database Replication**: MongoDB replica set
- **Queue System**: Bull/RabbitMQ for background processing

---

## 📊 Performance Optimizations

1. **Lazy Loading**: React.lazy() for code splitting
2. **PDF Streaming**: Chunked PDF loading
3. **Caching**: Summary and key features cached in MongoDB
4. **Pagination**: Quiz attempts paginated
5. **Indexing**: MongoDB indexes on userId, pdfId, createdAt
6. **Connection Pooling**: MongoDB connection pool
7. **Debouncing**: Search inputs debounced

---

## 🔗 External Service Dependencies

| Service | Purpose | Fallback Strategy |
|---------|---------|-------------------|
| Supabase | PDF storage | N/A (required) |
| Pinecone | Vector search | Disable RAG features |
| Google Gemini | AI responses | Switch to OpenAI |
| OpenAI | Embeddings/AI | Switch to Gemini |
| MongoDB | Data persistence | N/A (required) |

---

## 📖 Related Documentation

- [Developer Guide](./03_Developer_Guide.md) - Setup instructions
- [API Endpoints](../api/api_endpoints.md) - REST API reference
- [Service Integrations](../services/) - External service details
- [Data Flow](../technical/data_flow.md) - Detailed data movement

---

**Last Updated:** October 2025  
**Version:** 1.0.0
