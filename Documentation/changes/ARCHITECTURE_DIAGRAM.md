# Real-Time PDF Assistant - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │           ChatPanel Component                                │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Header: AI Pdf Buddy 🤖 [●]                         │ │  │
│  │  │  Status: Real-time AI • Feel free to ask anything     │ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │                                                        │ │  │
│  │  │  🤖  Hi there! 👋 I'm your AI Pdf Buddy...        │ │  │
│  │  │                                                        │ │  │
│  │  │              What are the key points? ▌             │ │  │
│  │  │                                                        │ │  │
│  │  │  🤖  The key points include... [streaming|]          │ │  │
│  │  │                                                        │ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │  [📝 Summarize] [💡 Explain] [🎯 Study Guide]       │ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │  [Feel free to ask anything...            ] [→]      │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            ↕                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │        useChatSocket Hook (Custom React Hook)               │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │ • isConnected, isTyping, streamingMessage            │ │  │
│  │  │ • sendMessage(content, pdfId, callbacks)             │ │  │
│  │  │ • joinPdf(pdfId), leavePdf(pdfId)                    │ │  │
│  │  │ • getChatHistory(pdfId, limit)                       │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            ↕                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Socket.io Client                               │  │
│  │  WebSocket Connection: ws://localhost:4000 (dev) / wss://beyondchats-cbtm.onrender.com (deployed)                  │  │
│  │  Auth: JWT Token from localStorage                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ ↕ ↕
                          Socket.io Events
                              ↕ ↕ ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    server.js                                │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │  HTTP Server (Express + Socket.io)                    │ │  │
│  │  │  • Port: 4000                                         │ │  │
│  │  │  • CORS: http://localhost:5174 (dev) / https://beyondchats-cbtm.onrender.com (deployed)                       │ │  │
│  │  │  • REST API: /api/*                                   │ │  │
│  │  │  • WebSocket: Socket.io                               │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            ↕                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │          chatSocket.js (Socket.io Handler)                  │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │  Middleware:                                          │ │  │
│  │  │  • JWT Authentication                                 │ │  │
│  │  │  • User Verification                                  │ │  │
│  │  │                                                        │ │  │
│  │  │  Events Handled:                                      │ │  │
│  │  │  • join-pdf(pdfId) → Join room                       │ │  │
│  │  │  • chat-message(content, pdfId) → Process           │ │  │
│  │  │  • get-chat-history(pdfId, limit) → Load            │ │  │
│  │  │                                                        │ │  │
│  │  │  Events Emitted:                                      │ │  │
│  │  │  • message-saved → User message confirmed           │ │  │
│  │  │  • ai-typing → AI processing indicator              │ │  │
│  │  │  • ai-response-chunk → Streaming chunks             │ │  │
│  │  │  • ai-response-complete → Full response             │ │  │
│  │  │  • chat-error → Error notifications                  │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            ↕                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │     pdfAssistant.service.js (AI Service)                    │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │  Functions:                                           │ │  │
│  │  │  • getPdfContext(pdfId) → Extract content           │ │  │
│  │  │  • buildAssistantPrompt(...) → Create prompt        │ │  │
│  │  │  • generateResponse(...) → Non-streaming            │ │  │
│  │  │  • generateStreamingResponse(...) → Stream          │ │  │
│  │  │                                                        │ │  │
│  │  │  LLM Clients:                                         │ │  │
│  │  │  • Gemini (gemini-2.0-flash-exp)                    │ │  │
│  │  │  • OpenAI (gpt-4o-mini)                              │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            ↕                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    MongoDB (Database)                       │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │  Collections:                                         │ │  │
│  │  │  • users → User accounts                             │ │  │
│  │  │  • pdfs → PDF documents & content                    │ │  │
│  │  │  • chatmessages → Message history                    │ │  │
│  │  │    - user (ObjectId)                                  │ │  │
│  │  │    - role ('user' | 'ai')                            │ │  │
│  │  │    - content (String)                                 │ │  │
│  │  │    - pdfId (ObjectId)                                 │ │  │
│  │  │    - createdAt (Date)                                 │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ ↕ ↕
                          HTTP/API Calls
                              ↕ ↕ ↕
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐  │
│  │    Google Gemini API         │  │    OpenAI API            │  │
│  │  • Model: gemini-2.0-flash   │  │  • Model: gpt-4o-mini    │  │
│  │  • Streaming: Native         │  │  • Streaming: SSE        │  │
│  │  • Max Tokens: 2000          │  │  • Max Tokens: 2000      │  │
│  └──────────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Message Flow Diagram

```
User Action: "What are the key points?"
    ↓
[FRONTEND]
ChatPanel.send()
    ↓
useChatSocket.sendMessage({
    content: "What are the key points?",
    pdfId: "123abc",
    conversationHistory: [...]
})
    ↓
Socket.io Client
    emit('chat-message', data)
    ↓
═══════════════════════════════════════
    ↓
[BACKEND]
Socket.io Server
    on('chat-message')
    ↓
JWT Authentication
    ✓ Valid User
    ↓
Save User Message to DB
    → ChatMessage.create(...)
    ↓
    emit('message-saved', userData)
    ↓
═══════════════════════════════════════
    ↓
PDF Assistant Service
    ↓
getPdfContext(pdfId)
    → Fetch from MongoDB
    → Returns: {
        title, content, chapters,
        summary, keyPoints, pages
    }
    ↓
buildAssistantPrompt(question, context)
    → Creates rich prompt with:
       • System role
       • Document context
       • Conversation history
       • Current question
       • Instructions
    ↓
generateStreamingResponse(prompt)
    ↓
    emit('ai-typing', { isTyping: true })
    ↓
═══════════════════════════════════════
    ↓
[LLM - Gemini/OpenAI]
Stream Generation
    ↓
    For each chunk:
        ↓
        emit('ai-response-chunk', { chunk })
        ↓
═══════════════════════════════════════
        ↓
[FRONTEND]
useChatSocket receives chunk
    ↓
onChunk callback
    ↓
setStreamingMessage(prev + chunk)
    ↓
ChatPanel re-renders
    ↓
Display chunk with cursor |
═══════════════════════════════════════
    ↓
[BACKEND]
Stream Complete
    ↓
    emit('ai-typing', { isTyping: false })
    ↓
Save AI Response to DB
    → ChatMessage.create(...)
    ↓
    emit('ai-response-complete', {
        messageId, content, timestamp
    })
    ↓
═══════════════════════════════════════
    ↓
[FRONTEND]
onComplete callback
    ↓
Add message to list
    ↓
Clear streaming text
    ↓
ChatPanel shows complete message
    ↓
Done! ✓
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────┐
│                  User Interface Flow                       │
└────────────────────────────────────────────────────────────┘

LibraryPage
    ↓ (select PDF)
PDFViewerPage
    ↓ (contains)
┌────────────────┐
│   ChatPanel    │
│  ┌──────────┐  │
│  │  Header  │  │ ← Shows connection status
│  └──────────┘  │
│  ┌──────────┐  │
│  │ Messages │  │ ← Displays chat history
│  │          │  │   + streaming messages
│  └──────────┘  │
│  ┌──────────┐  │
│  │  Quick   │  │ ← Suggestion buttons
│  │ Actions  │  │
│  └──────────┘  │
│  ┌──────────┐  │
│  │  Input   │  │ ← Text input + send button
│  └──────────┘  │
└────────────────┘
    ↓ (uses)
┌────────────────┐
│ useChatSocket  │ ← Custom React Hook
│                │   • Manages Socket.io connection
│                │   • Handles events
│                │   • Provides callbacks
└────────────────┘
    ↓ (connects to)
┌────────────────┐
│ Socket.io      │ ← Real-time communication
│ Client         │   • WebSocket connection
│                │   • Event emitters/listeners
│                │   • Auto-reconnect
└────────────────┘
```

## State Management Flow

```
[ChatPanel State]
┌──────────────────────────────────────────────────────────┐
│ messages: Array<Message>                                 │
│   • User messages                                        │
│   • AI messages                                          │
│   • Stored in state + MongoDB                           │
│                                                           │
│ input: String                                            │
│   • Current user input                                   │
│   • Cleared on send                                      │
│                                                           │
│ streamingText: String                                    │
│   • Accumulates chunks                                   │
│   • Displayed with cursor                                │
│   • Cleared when complete                                │
└──────────────────────────────────────────────────────────┘

[useChatSocket State]
┌──────────────────────────────────────────────────────────┐
│ isConnected: Boolean                                     │
│   • true → Socket.io connected (green dot)               │
│   • false → Disconnected (red dot, use REST)            │
│                                                           │
│ isTyping: Boolean                                        │
│   • true → Show typing indicator                         │
│   • false → Hide indicator                               │
│                                                           │
│ streamingMessage: String                                 │
│   • Current streaming text                               │
│   • Updated on each chunk                                │
│                                                           │
│ error: String | null                                     │
│   • Error message if any                                 │
│   • null when no error                                   │
└──────────────────────────────────────────────────────────┘
```

## Security Flow

```
1. User Authentication
   ├─ Login → JWT token generated
   ├─ Token stored in localStorage
   └─ Token included in Socket.io auth

2. Socket.io Connection
   ├─ Client sends JWT token
   ├─ Server middleware validates token
   ├─ User object attached to socket
   └─ Connection accepted/rejected

3. Message Authorization
   ├─ User can only send as themselves
   ├─ User can only read own messages
   ├─ PDF access checked per user
   └─ Room isolation per PDF

4. Data Validation
   ├─ Content length limits
   ├─ Rate limiting (Socket.io)
   ├─ Input sanitization
   └─ Error handling
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Production Setup                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Frontend - Vercel/Netlify]                           │
│    • React SPA                                         │
│    • Built assets                                      │
│    • Environment variables                             │
│    • HTTPS enabled                                     │
│                                                         │
│  [Backend - Heroku/Railway/AWS]                        │
│    • Node.js server                                    │
│    • Socket.io server                                  │
│    • REST API endpoints                                │
│    • Environment variables                             │
│    • HTTPS + WSS enabled                               │
│                                                         │
│  [Database - MongoDB Atlas]                            │
│    • Managed MongoDB                                   │
│    • Replica sets                                      │
│    • Automatic backups                                 │
│    • Connection pooling                                │
│                                                         │
│  [LLM API - Google Cloud/OpenAI]                       │
│    • API key authentication                            │
│    • Rate limiting                                     │
│    • Usage monitoring                                  │
│    • Fallback options                                  │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
[Caching Strategy]
┌──────────────────────────────────────────────────────────┐
│ • PDF context cached per PDF ID                         │
│ • LLM responses not cached (unique per query)           │
│ • Socket.io connections pooled                          │
│ • Message history paginated                             │
└──────────────────────────────────────────────────────────┘

[Resource Management]
┌──────────────────────────────────────────────────────────┐
│ • Context window limited to 3000 chars                  │
│ • Conversation history limited to 5 messages            │
│ • Streaming chunks sent immediately (no buffering)      │
│ • Room-based message isolation                          │
└──────────────────────────────────────────────────────────┘

[Scalability]
┌──────────────────────────────────────────────────────────┐
│ • Horizontal scaling with Socket.io adapter             │
│ • Redis adapter for multi-instance deployments          │
│ • Load balancing with sticky sessions                   │
│ • Database connection pooling                           │
└──────────────────────────────────────────────────────────┘
```

---

**Legend:**
- ↓ → Flow direction
- ═ → Network boundary
- □ → Component/Service
- • → Feature/Property
- ✓ → Success/Validation
