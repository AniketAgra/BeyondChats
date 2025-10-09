# 📄 PDF Viewer Page Documentation

## Overview

The PDF Viewer page is the core workspace where users interact with their uploaded documents through AI-powered features including chat, notes, and quiz generation.

**Route:** `/pdf/:id`  
**File:** `Frontend/src/pages/PDFPage.jsx`  
**Authentication:** Required

---

## 🎯 Purpose

- **Document Reading** - View PDF with zoom, navigation controls
- **AI Assistance** - Real-time chat about PDF content (AI PDF Buddy)
- **Note-Taking** - Create text and audio notes linked to pages
- **Quick Assessment** - Generate quizzes from current PDF
- **Key Insights** - View AI-extracted key features/summary

---

## 📐 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar                                                         │
├───────────┬─────────────────────────────────────┬───────────────┤
│           │                                     │               │
│  Sidebar  │       PDF Viewer                    │  Right Panel  │
│           │                                     │               │
│  PDF List │  ┌─────────────────────────────┐   │  ┌──────────┐ │
│  ┌──────┐ │  │                             │   │  │ Chat 💬  │ │
│  │ PDF1 │ │  │     PDF Document Display    │   │  │ Notes 📝 │ │
│  ├──────┤ │  │                             │   │  │ Suggest🎥│ │
│  │ PDF2 │ │  │     [PDF Content Rendered]  │   │  └──────────┘ │
│  └──────┘ │  │                             │   │               │
│           │  └─────────────────────────────┘   │  Active Tab   │
│  Upload + │                                     │  Content      │
│           │  [Zoom] [Page Nav] [Quiz Button]   │               │
└───────────┴─────────────────────────────────────┴───────────────┘
```

---

## 🧩 Components

### 1. Sidebar Component
**File:** `Frontend/src/components/Sidebar/Sidebar.jsx`

**Purpose:** Quick access to user's PDF library

**Features:**
- List of all uploaded PDFs
- Click to switch between PDFs
- Upload new PDF button
- Current PDF highlighted
- Responsive collapse on mobile

**API:** `GET /api/pdf` - Fetches user's PDF list

---

### 2. PDFViewer Component
**File:** `Frontend/src/components/PDFViewer/PDFViewer.jsx`

**Purpose:** Render and navigate PDF document

**Technology:** `react-pdf` library

**Features:**
- **Page Navigation:** Previous/Next buttons, page number input
- **Zoom Controls:** Zoom in/out, fit to width
- **Loading State:** Skeleton while PDF loads
- **Error Handling:** Fallback UI if PDF fails to load

**Controls:**
```jsx
<div className={styles.controls}>
  <button onClick={previousPage}>← Previous</button>
  <span>Page {currentPage} of {totalPages}</span>
  <button onClick={nextPage}>Next →</button>
  <button onClick={zoomIn}>🔍+</button>
  <button onClick={zoomOut}>🔍−</button>
</div>
```

**Implementation:**
```jsx
import { Document, Page, pdfjs } from 'react-pdf';

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFViewer({ pdfUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <Document
      file={pdfUrl}
      onLoadSuccess={onDocumentLoadSuccess}
    >
      <Page pageNumber={pageNumber} scale={scale} />
    </Document>
  );
}
```

---

### 3. RightPanel Component
**File:** `Frontend/src/components/RightPanel/RightPanel.jsx`

**Purpose:** Tabbed interface for Chat, Notes, and YouTube suggestions

**Tabs:**
- **💬 Chat** - AI PDF Buddy interface
- **📝 Notes** - Text/audio note-taking
- **🎥 Suggestions** - YouTube video recommendations

**Tab Switching:**
```jsx
const [activeTab, setActiveTab] = useState('chat');

<div className={styles.tabs}>
  <button 
    className={activeTab === 'chat' ? styles.active : ''}
    onClick={() => setActiveTab('chat')}
  >
    💬 Chat
  </button>
  <button 
    className={activeTab === 'notes' ? styles.active : ''}
    onClick={() => setActiveTab('notes')}
  >
    📝 Notes
  </button>
  <button 
    className={activeTab === 'suggestions' ? styles.active : ''}
    onClick={() => setActiveTab('suggestions')}
  >
    🎥 Suggestions
  </button>
</div>

{activeTab === 'chat' && <ChatPanel pdfId={pdfId} />}
{activeTab === 'notes' && <NotesPanel pdfId={pdfId} />}
{activeTab === 'suggestions' && <YouTubeSuggestions pdfTitle={pdfTitle} />}
```

---

### 4. ChatPanel Component (AI PDF Buddy)
**File:** `Frontend/src/components/ChatPanel/ChatPanel.jsx`

**Purpose:** Real-time AI chat about PDF content

**Features:**
- **Context-Aware:** AI has access to current PDF
- **Predefined Actions:** Quick buttons (Summarize, Explain, Study Guide)
- **Real-Time Responses:** Streaming via Socket.IO
- **Chat History:** Persistent conversation per PDF
- **Word Limit:** Concise AI responses (300-500 words)

**UI Elements:**
```jsx
<div className={styles.chatContainer}>
  {/* Status Indicator */}
  <div className={styles.status}>
    <span className={styles.indicator}>●</span>
    Real-time AI • Feel free to ask anything
  </div>

  {/* Chat Messages */}
  <div className={styles.messages}>
    {messages.map(msg => (
      <div className={msg.role === 'user' ? styles.userMessage : styles.aiMessage}>
        {msg.role === 'ai' && '🤖 '}
        {msg.content}
      </div>
    ))}
    {isTyping && <div className={styles.typing}>AI is typing...</div>}
  </div>

  {/* Quick Actions */}
  <div className={styles.quickActions}>
    <button onClick={() => sendPredefined('summarize')}>📝 Summarize</button>
    <button onClick={() => sendPredefined('explain')}>💡 Explain</button>
    <button onClick={() => sendPredefined('studyGuide')}>🎯 Study Guide</button>
  </div>

  {/* Input */}
  <form onSubmit={handleSubmit}>
    <input 
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Ask anything about this PDF..."
    />
    <button type="submit">→</button>
  </form>
</div>
```

**Socket.IO Integration:**
```jsx
const { sendMessage, messages, isTyping, isConnected } = useChatSocket(pdfId);

function handleSubmit(e) {
  e.preventDefault();
  if (!input.trim()) return;
  
  sendMessage(input, pdfId, {
    onSaved: (msg) => console.log('Message saved:', msg),
    onComplete: (response) => console.log('AI response:', response)
  });
  
  setInput('');
}
```

**API:** WebSocket events via `useChatSocket` hook

---

### 5. NotesPanel Component
**File:** `Frontend/src/components/NotesPanel/NotesPanel.jsx`

**Purpose:** Create and manage notes linked to PDF

**Note Types:**
- **Text Notes:** Rich text input
- **Audio Notes:** Record voice memos

**Features:**
- Notes linked to specific page numbers
- Timestamp display
- Edit/Delete functionality
- Search/filter notes

**UI:**
```jsx
<div className={styles.notesPanel}>
  <div className={styles.header}>
    <h3>Notes</h3>
    <button onClick={() => setMode('text')}>Text Note</button>
    <button onClick={() => setMode('audio')}>🎤 Record</button>
  </div>

  <div className={styles.notesList}>
    {notes.map(note => (
      <div className={styles.noteCard} key={note._id}>
        <div className={styles.noteHeader}>
          <span>Page {note.page}</span>
          <span>{formatDate(note.createdAt)}</span>
        </div>
        <p>{note.content}</p>
        <div className={styles.actions}>
          <button onClick={() => editNote(note)}>Edit</button>
          <button onClick={() => deleteNote(note._id)}>Delete</button>
        </div>
      </div>
    ))}
  </div>
</div>
```

**API Endpoints:**
- `GET /api/notes?pdfId=:id` - Fetch notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

---

### 6. YouTubeSuggestions Component
**File:** `Frontend/src/components/YouTubeSuggestions/YouTubeSuggestions.jsx`

**Purpose:** Recommend educational videos related to PDF content

**Features:**
- Suggests videos based on PDF title/topics
- Thumbnail previews
- Opens videos in new tab
- YouTube API integration

**API:** `GET /api/youtube/suggest?topic=:topic`

---

## 🔄 Data Flow

### Page Load Sequence

```javascript
useEffect(() => {
  const pdfId = params.id;
  
  // 1. Fetch PDF metadata
  const pdf = await pdfApi.get(pdfId);
  setPdfData(pdf);
  
  // 2. Load chat history
  const chatHistory = await chatApi.getHistory({ pdfId });
  setChatMessages(chatHistory);
  
  // 3. Load notes
  const notes = await notesApi.list(pdfId);
  setNotes(notes);
  
  // 4. Join PDF room for real-time chat
  socket.emit('join-pdf', { pdfId });
  
  // 5. Fetch key features (if available)
  const keyFeatures = await keyFeaturesApi.get(pdfId);
  setKeyFeatures(keyFeatures);
}, [params.id]);
```

---

## 📡 API Endpoints Used

### 1. GET /api/pdf/:id
**Purpose:** Fetch PDF metadata

**Response:**
```json
{
  "_id": "abc123",
  "user": "user123",
  "url": "https://supabase.co/signed-url",
  "filename": "physics_xi.pdf",
  "title": "Physics Class XI",
  "author": "NCERT",
  "size": 2048576,
  "summary": "This textbook covers fundamental physics...",
  "chapters": ["Motion", "Forces", "Energy"],
  "uploadedAt": "2025-10-01T10:00:00Z"
}
```

### 2. WebSocket: join-pdf
**Purpose:** Join PDF-specific chat room

```javascript
socket.emit('join-pdf', { pdfId: 'abc123' });
// Server acknowledges and user joins room
```

### 3. WebSocket: chat-message
**Purpose:** Send message to AI

```javascript
socket.emit('chat-message', {
  content: "What are the key points?",
  pdfId: "abc123"
});

// Server responds with:
// 1. 'message-saved' - User message stored
// 2. 'ai-typing' - AI is processing
// 3. 'ai-response-chunk' - Streaming chunks
// 4. 'ai-response-complete' - Full response
```

### 4. GET /api/chat?pdfId=:id&limit=50
**Purpose:** Load chat history

**Response:**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "role": "user",
      "content": "What is Newton's First Law?",
      "pdfId": "abc123",
      "createdAt": "2025-10-09T10:00:00Z"
    },
    {
      "_id": "msg124",
      "role": "ai",
      "content": "Newton's First Law states that...",
      "pdfId": "abc123",
      "createdAt": "2025-10-09T10:00:05Z"
    }
  ]
}
```

---

## 🎨 Responsive Design

### Desktop (>1024px)
- 3-column layout: Sidebar | PDF Viewer | Right Panel
- Sidebar: 250px fixed width
- PDF Viewer: Flexible center
- Right Panel: 400px fixed width

### Tablet (768px-1024px)
- Sidebar collapses to icon bar
- PDF Viewer: Full width
- Right Panel: Overlay modal

### Mobile (<768px)
- Single column layout
- Sidebar: Slide-in drawer
- PDF Viewer: Full screen
- Right Panel: Bottom sheet tabs

---

## 🚀 Performance Optimizations

1. **Lazy PDF Loading:** Load pages as user scrolls
2. **Chat Pagination:** Load last 50 messages, infinite scroll for older
3. **Debounced Search:** For notes filtering
4. **Memoized Components:** React.memo for ChatPanel, NotesPanel
5. **Socket Connection Pooling:** Reuse socket across PDFs

---

## 🔐 Security

- **PDF Access Control:** Verify userId matches PDF owner before serving
- **Supabase Signed URLs:** Time-limited access to PDF files
- **Chat Context Isolation:** AI only accesses current PDF, not other user's data
- **Note Privacy:** Notes scoped to userId and pdfId

---

## 🐛 Common Issues

### Issue: PDF Not Loading
**Causes:**
- Supabase URL expired
- CORS issue with PDF.js worker
- File corrupted

**Solutions:**
- Regenerate signed URL
- Verify worker CDN is accessible
- Re-upload PDF

### Issue: Chat Not Connecting
**Causes:**
- Socket.IO connection failed
- Backend not running
- JWT expired

**Solutions:**
- Check backend health endpoint
- Refresh authentication token
- Verify WebSocket port is open

---

## 📚 Related Documentation

- [AI PDF Buddy](./page_ai_pdf_buddy.md)
- [Notes System](./page_notes.md)
- [Quiz Generation](./page_quiz_engine.md)
- [API Endpoints - PDF](../api/api_endpoints.md#pdf)
- [Supabase Service](../services/service_supabase.md)

---

**Developer Notes:**
- Consider adding PDF annotation/highlighting (future)
- Implement PDF download button
- Add bookmark functionality
- Enable sharing PDF with other users (future)

---

**Last Updated:** October 2025  
**Version:** 1.0.0
