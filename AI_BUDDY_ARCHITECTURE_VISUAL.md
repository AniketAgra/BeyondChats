# 🏗️ AI Study Buddy Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     /aibuddy Page                           │ │
│  │  ┌──────────────┐  ┌──────────────────────────────────┐   │ │
│  │  │              │  │                                    │   │ │
│  │  │  ChatSidebar │  │     Chat Area                     │   │ │
│  │  │              │  │  - Messages Display                │   │ │
│  │  │  📁 PDF      │  │  - Typing Indicator               │   │ │
│  │  │  Chats       │  │  - Input Field                    │   │ │
│  │  │  • Physics   │  │  - Send Button                    │   │ │
│  │  │  • Chemistry │  │                                    │   │ │
│  │  │              │  │  Current Session:                  │   │ │
│  │  │  🧠 General  │  │  [Selected from Sidebar]          │   │ │
│  │  │  Chats       │  │                                    │   │ │
│  │  │  • Study     │  │                                    │   │ │
│  │  │  • Weak      │  │                                    │   │ │
│  │  │    Topics    │  │                                    │   │ │
│  │  │              │  │                                    │   │ │
│  │  └──────────────┘  └──────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              API Routes (/api/ai-buddy)                     │ │
│  │  • GET /sessions           - List all chats                │ │
│  │  • POST /sessions          - Create new chat               │ │
│  │  • GET /sessions/:id/messages - Get messages               │ │
│  │  • POST /sessions/:id/messages - Send message              │ │
│  │  • PATCH /sessions/:id     - Rename chat                   │ │
│  │  • DELETE /sessions/:id    - Delete chat                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           aiStudyBuddy.service.js                           │ │
│  │                                                              │ │
│  │  ┌──────────────────┐      ┌──────────────────┐           │ │
│  │  │  PDF Chat Logic  │      │ General AI Logic │           │ │
│  │  │                  │      │                  │           │ │
│  │  │  • PDF Context   │      │  • All PDFs      │           │ │
│  │  │  • PDF Quizzes   │      │  • All Quizzes   │           │ │
│  │  │  • Vector Search │      │  • Performance   │           │ │
│  │  │    (1 PDF)       │      │  • Vector Search │           │ │
│  │  │                  │      │    (All Context) │           │ │
│  │  └──────────────────┘      └──────────────────┘           │ │
│  │              │                        │                     │ │
│  │              └────────┬───────────────┘                     │ │
│  │                       ▼                                     │ │
│  │          ┌────────────────────────┐                        │ │
│  │          │  vector.service.js     │                        │ │
│  │          │  • querySimilarVectors │                        │ │
│  │          │  • storePDFEmbeddings  │                        │ │
│  │          │  • storeQuizContext    │                        │ │
│  │          └────────────────────────┘                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
           │                              │
           │ MongoDB                      │ Pinecone API
           ▼                              ▼
┌────────────────────────┐    ┌────────────────────────┐
│     MongoDB            │    │      Pinecone          │
│  ┌──────────────────┐ │    │  ┌──────────────────┐  │
│  │  ChatSession     │ │    │  │  Namespaces:     │  │
│  │  • user          │ │    │  │                  │  │
│  │  • type          │ │    │  │  userId/pdfId    │  │
│  │  • pdfId         │ │    │  │  ├─ chunk_0     │  │
│  │  • title         │ │    │  │  ├─ chunk_1     │  │
│  │  • context       │ │    │  │  └─ ...         │  │
│  └──────────────────┘ │    │  │                  │  │
│  ┌──────────────────┐ │    │  │  userId/quiz     │  │
│  │  SessionMessage  │ │    │  │  ├─ quiz_1      │  │
│  │  • sessionId     │ │    │  │  ├─ quiz_2      │  │
│  │  • role          │ │    │  │  └─ ...         │  │
│  │  • content       │ │    │  └──────────────────┘  │
│  │  • meta          │ │    │                        │
│  └──────────────────┘ │    │  Vector Search         │
│  ┌──────────────────┐ │    │  • Embeddings          │
│  │  QuizAttempt     │ │    │  • Similarity          │
│  │  • score         │ │    │  • Top K Results       │
│  │  • weakTopics    │ │    └────────────────────────┘
│  └──────────────────┘ │
└────────────────────────┘
```

## Data Flow: Sending a Message

```
1. User Types Message
   │
   ├─> "Explain electromagnetic induction"
   │
2. Frontend: AIBuddyPage
   │
   ├─> POST /api/ai-buddy/sessions/:id/messages
   │   { content: "Explain...", useRAG: true }
   │
3. Backend: aibuddy.routes.js
   │
   ├─> sendMessageInSession(sessionId, userId, content, useRAG)
   │
4. Service: aiStudyBuddy.service.js
   │
   ├─> Determine Session Type
   │   │
   │   ├─ PDF Chat?
   │   │  └─> generatePDFSpecificResponse()
   │   │      ├─> Query Pinecone: userId/pdfId
   │   │      ├─> Get PDF quiz performance
   │   │      └─> Generate response
   │   │
   │   └─ General Chat?
   │      └─> generateStudyBuddyResponse()
   │          ├─> Query Pinecone: userId/quiz_context
   │          ├─> Get all quiz performance
   │          ├─> Get weak topics
   │          └─> Generate response
   │
5. OpenAI LLM
   │
   ├─> Generate contextualized response
   │
6. Save to MongoDB
   │
   ├─> UserMessage + AIMessage
   │
7. Return to Frontend
   │
   └─> Display in chat
```

## Chat Type Comparison

```
┌─────────────────────────┬──────────────────────────────────┐
│    PDF-Specific Chat    │      General AI Study Buddy      │
├─────────────────────────┼──────────────────────────────────┤
│ Context: Single PDF     │ Context: All Study Materials     │
│ Memory: PDF Conv Only   │ Memory: Cross-PDF Learning       │
│ Vector: userId/pdfId    │ Vector: userId/quiz_context      │
│ Performance: PDF Quizzes│ Performance: All Quizzes         │
│ Use Case: Deep Dive     │ Use Case: Study Planning         │
└─────────────────────────┴──────────────────────────────────┘
```

## Vector Storage Strategy

```
Pinecone Index: edulearn-vectors
│
├─ Namespace: user123/pdf456 (PDF-Specific)
│  ├─ Vector: pdf456_chunk_0
│  │  ├─ values: [0.012, 0.33, ...] (1536 dims)
│  │  └─ metadata: {
│  │       userId: "user123",
│  │       pdfId: "pdf456",
│  │       text: "Electromagnetic induction...",
│  │       chapter: "Chapter 5",
│  │       pageNumber: 42
│  │     }
│  │
│  └─ Vector: pdf456_chunk_1
│     └─ ...
│
└─ Namespace: user123/quiz_context (General Learning)
   ├─ Vector: quiz_789
   │  ├─ values: [0.45, 0.12, ...] (1536 dims)
   │  └─ metadata: {
   │       userId: "user123",
   │       quizId: "quiz_789",
   │       topics: ["Physics", "EM Induction"],
   │       weakTopics: ["Lenz Law"],
   │       score: 62,
   │       type: "quiz_performance"
   │     }
   │
   └─ Vector: quiz_790
      └─ ...
```

## Performance Data Integration

```
Quiz Attempt (MongoDB)
│
├─ user: ObjectId
├─ pdfId: ObjectId (optional)
├─ score: 62
├─ questions: [...]
├─ topic: "Electromagnetic Induction"
│
│  On Quiz Submission
│  ↓
├─> Store in Pinecone
│   ├─ Namespace: userId/quiz_context
│   ├─ Create embedding from: "Topic + Weak Areas + Score"
│   └─ Store vector with metadata
│
└─> Update ChatSession.context
    └─ weakTopics: ["EM Induction"]
        averageScore: 62
```

## Session Management Flow

```
User Actions:
│
├─ Create New Chat
│  └─> POST /sessions { type: "general" }
│     └─> ChatSession created
│        └─> Added to sidebar
│
├─ Select Chat
│  └─> GET /sessions/:id/messages
│     └─> Messages loaded
│        └─> Display in chat area
│
├─ Rename Chat
│  └─> PATCH /sessions/:id { title: "New Name" }
│     └─> Title updated
│        └─> Sidebar refreshed
│
└─ Delete Chat
   └─> DELETE /sessions/:id
      └─> Session.isActive = false
         └─> Removed from sidebar
```

---

## Key Separation Principles

1. **PDF Chats ≠ General Chats**
   - Different vector namespaces
   - Different performance contexts
   - Separate message histories

2. **Memory Isolation**
   - PDF chats: Only that PDF's content
   - General chats: All learning data

3. **Performance Awareness**
   - Both types know quiz scores
   - Both adapt to weak topics
   - Different scopes of data

4. **Vector Organization**
   - Clear namespace structure
   - User-based isolation
   - Content-type separation

---

**This architecture ensures:**
✅ Clear separation of concerns  
✅ Efficient vector search  
✅ Personalized learning experience  
✅ Scalable chat management  
✅ Performance-aware AI responses
