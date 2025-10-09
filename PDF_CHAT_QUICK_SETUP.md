# PDF Chat Sessions - Quick Setup Guide

## What This Feature Does

Creates **individual chat sessions for each PDF** with **isolated memory**, displayed in an organized sidebar. Each PDF maintains its own conversation history that persists across sessions.

## Files Changed

### ✅ Backend Files
1. `Backend/src/services/aiStudyBuddy.service.js`
   - Enhanced `createChatSession()` to auto-populate PDF metadata
   - Enhanced `sendMessageInSession()` to route PDF sessions to PDF-specific AI

2. `Backend/src/routes/aibuddy.js`
   - Added new endpoint: `GET /api/ai-buddy/sessions/pdf/:pdfId`

### ✅ Frontend Files
1. `Frontend/src/components/ChatSidebar/ChatSidebar.jsx`
   - Added PDF count badge
   - Enhanced PDF session display with icons
   - Better visual structure

2. `Frontend/src/components/ChatSidebar/ChatSidebar.module.css`
   - Added `.sectionCount` styling
   - Added `.pdfSessionItem` styling
   - Added `.pdfIconWrapper` styling
   - Enhanced scrolling behavior

3. `Frontend/src/utils/api.js`
   - Added `getPDFSession(pdfId)` method

## How to Use

### From Frontend - Get or Create PDF Session

```javascript
import { aiBuddyApi } from '../utils/api.js'

// Automatically gets existing session or creates new one
const response = await aiBuddyApi.getPDFSession(pdfId)
const session = response.session
const isNew = response.created

console.log(`Session ${isNew ? 'created' : 'loaded'} for PDF:`, session.title)
```

### Load All PDF Sessions

```javascript
const { sessions } = await aiBuddyApi.getSessions('pdf')

sessions.forEach(s => {
  console.log(`PDF: ${s.pdfId.title}, Messages: ${s.messageCount}`)
})
```

### Send Message in PDF Session

```javascript
const result = await aiBuddyApi.sendMessage(
  sessionId,
  "Explain this concept from the PDF",
  true // useRAG - uses PDF-specific context
)

const [userMessage, aiMessage] = result.messages
console.log('AI Response:', aiMessage.content)
```

## Testing the Feature

### 1. Start the Backend
```bash
cd Backend
npm start
```

### 2. Start the Frontend
```bash
cd Frontend
npm run dev
```

### 3. Test Flow

1. **Login to the application**
2. **Upload a PDF** or open an existing one
3. **Go to AI Buddy page** (`/aibuddy`)
4. **Check the sidebar** - You should see:
   - "📄 PDF CHATS" section
   - Count badge showing number of PDFs
   - Your PDF listed with its name

5. **Create another PDF session**:
   ```javascript
   // In browser console or from code:
   await aiBuddyApi.getPDFSession('another-pdf-id')
   ```

6. **Verify isolation**:
   - Send messages in PDF 1 chat
   - Switch to PDF 2 chat
   - Messages from PDF 1 should NOT appear in PDF 2
   - Switch back to PDF 1 - messages should be preserved

## What Happens Behind the Scenes

### When User Opens a PDF

```
1. Frontend calls: aiBuddyApi.getPDFSession(pdfId)
          ↓
2. Backend checks database:
   - Query: ChatSession.find({ user, pdfId, type: 'pdf' })
          ↓
3a. IF SESSION EXISTS:
    - Returns existing session with all metadata
    - Frontend loads conversation history
          ↓
3b. IF SESSION DOESN'T EXIST:
    - Creates new ChatSession
    - Fetches PDF details (title, filename)
    - Populates session.title with PDF name
    - Saves session metadata
    - Returns new session
          ↓
4. Frontend displays in sidebar:
   - PDF icon with colored background
   - PDF name as title
   - Message count
   - Last activity time
```

### When User Sends Message

```
1. Frontend calls: aiBuddyApi.sendMessage(sessionId, content)
          ↓
2. Backend checks session type:
   - IF session.type === 'pdf':
     → Routes to aiPdfBuddy.service.js
     → Uses PDF-specific RAG (queryPDFContext)
     → Returns concise, PDF-focused response
   
   - IF session.type === 'general':
     → Routes to aiStudyBuddy.service.js
     → Uses general RAG (queryGeneralContext)
     → Returns comprehensive, personalized response
          ↓
3. Saves both user message and AI response:
   - SessionMessage.create({ sessionId, role: 'user', content })
   - SessionMessage.create({ sessionId, role: 'ai', content })
          ↓
4. Updates session metadata:
   - session.messageCount += 2
   - session.lastMessageAt = new Date()
          ↓
5. Returns messages to frontend
   - Frontend displays in chat UI
   - Sidebar updates message count
```

## Key Features Explained

### 1. **Isolated Memory**
- Each PDF has its own `ChatSession` document in database
- Messages are linked to `sessionId`, not directly to `pdfId`
- Conversations never mix between different PDFs

### 2. **Persistent Storage**
- All messages stored in `SessionMessage` collection
- Sessions persist across browser sessions
- User can close browser and return later to same conversation

### 3. **Auto-Population**
- When creating a PDF session, backend automatically:
  - Fetches PDF title from database
  - Sets `session.title` to PDF name
  - Stores PDF title in `session.meta.pdfTitle`
  - Populates `pdfId` reference

### 4. **Smart Routing**
- Backend automatically routes messages based on session type
- PDF sessions get PDF-specific AI responses
- General sessions get comprehensive Study Buddy responses

### 5. **Scalable UI**
- Sidebar PDF section scrolls independently
- Handles 100+ PDFs without UI issues
- Clear visual organization

## Integration with Existing Features

### Works With AI Study Buddy
- PDF chats appear in same sidebar as general chats
- Easy switching between PDF and general conversations
- Unified session management

### Works With PDF Viewer
- Can be integrated with `FloatingAIBuddy` component
- Can auto-load session when PDF opens
- Can show chat inline with PDF viewer

### Works With Quiz System
- PDF-specific quiz data can inform AI responses
- Weak topics from PDF quizzes included in context
- Performance tracking per PDF

## Future Enhancements (Optional)

### 1. Auto-Load Session on PDF Open
```javascript
// In PDFPage.jsx
useEffect(() => {
  if (id) {
    aiBuddyApi.getPDFSession(id).then(({ session }) => {
      setCurrentPDFSession(session)
    })
  }
}, [id])
```

### 2. Inline Chat Widget
```jsx
// In PDFPage.jsx
<PDFChatWidget sessionId={currentPDFSession?._id} />
```

### 3. Session Search
```jsx
<input 
  placeholder="Search PDF chats..."
  onChange={(e) => filterSessions(e.target.value)}
/>
```

### 4. Export Chat History
```javascript
const exportChat = async (sessionId) => {
  const { messages } = await aiBuddyApi.getMessages(sessionId, 1000)
  downloadAsJSON(messages, 'chat-history.json')
}
```

## Troubleshooting

### Sessions Not Appearing in Sidebar
1. Check if `getSessions()` is called on component mount
2. Verify backend API is running
3. Check browser console for errors
4. Verify user is authenticated

### PDF Name Not Showing
1. Check if PDF has `title` field in database
2. Verify `populate('pdfId', 'title')` in backend query
3. Fallback to `filename` if title is missing

### Messages Going to Wrong Session
1. Verify `sessionId` is correct when sending message
2. Check active session state in frontend
3. Verify `onSelectSession` updates active session

### Styling Issues
1. Ensure CSS variables are defined in theme
2. Check if `ChatSidebar.module.css` is imported
3. Verify icon library (react-icons) is installed

## Summary

✅ **Individual chat per PDF** - Each PDF has its own conversation
✅ **Isolated memory** - Messages never mix between PDFs
✅ **Persistent storage** - Chats survive browser restarts
✅ **Auto-populated names** - PDF titles shown automatically
✅ **Scrollable sidebar** - Handles many PDFs gracefully
✅ **PDF-specific AI** - Smart routing to appropriate AI service
✅ **Easy integration** - Simple API to get/create sessions

The system is now ready to provide organized, context-aware conversations for each study material! 🎉
