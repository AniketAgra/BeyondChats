# Real-Time AI Chat - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB running
- Gemini API key (or OpenAI API key)

### Step 1: Backend Setup

1. **Navigate to backend directory**
```bash
cd Backend
```

2. **Install dependencies** (if not already installed)
```bash
npm install
```

3. **Configure environment variables**
Edit `.env` file:
```bash
# LLM Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Database
MONGO_URI=mongodb://localhost:27017/beyondchats

# JWT Secret
JWT_SECRET=your_secret_key_here

# CORS
ORIGIN=http://localhost:5173

# Server Port
PORT=4000
```

4. **Start backend server**
```bash
npm run dev
```

You should see:
```
✓ MongoDB connected
✓ API on http://localhost:4000
✓ Socket.IO ready for real-time chat
```

### Step 2: Frontend Setup

1. **Navigate to frontend directory**
```bash
cd Frontend
```

2. **Install dependencies** (if not already installed)
```bash
npm install
```

3. **Start frontend dev server**
```bash
npm run dev
```

You should see:
```
✓ Local:   http://localhost:5173/
```

### Step 3: Test the Feature

1. **Open browser** to `http://localhost:5173`

2. **Login/Register** if you haven't already

3. **Upload a PDF** from the Library page

4. **Click on the PDF** to open it

5. **Look for the Chat Panel** (AI Pdf Buddy)

6. **Check connection status**:
   - 🟢 Green dot = Connected (Real-time streaming enabled)
   - 🔴 Red dot = Disconnected (Fallback to REST API)

7. **Ask a question**:
   - Type: "What are the key points of this document?"
   - Press Enter or click Send
   - Watch the response stream in real-time!

## 📊 Feature Verification

### ✅ Connection Test
- Open DevTools → Console
- Look for: `Socket.io connected`
- Connection indicator should be green

### ✅ Streaming Test
- Ask any question
- Response should appear word-by-word
- Blinking cursor should show during generation

### ✅ Context Test
- Ask: "Summarize this PDF"
- Response should reference actual PDF content
- Should mention document title/key points

## 🔧 Troubleshooting

### Socket.io Not Connecting

**Problem**: Red status indicator, console shows connection errors

**Solutions**:
1. Check backend is running: `http://localhost:4000/api/health`
2. Verify JWT token in localStorage
3. Check CORS settings in backend `.env`
4. Clear browser cache and reload

### No Streaming (Instant Response)

**Problem**: Response appears all at once instead of streaming

**Solutions**:
1. Check `LLM_PROVIDER` in `.env` is set
2. Verify API key is correct
3. Check console for API errors
4. May fallback to REST API if Socket.io disconnected

### "AI service not configured" Error

**Problem**: Backend can't connect to LLM

**Solutions**:
1. Set `GEMINI_API_KEY` in backend `.env`
2. Or set `OPENAI_API_KEY` and `LLM_PROVIDER=openai`
3. Restart backend server
4. Verify API key is valid

### Generic Responses (Not PDF-Specific)

**Problem**: AI doesn't reference PDF content

**Solutions**:
1. Ensure PDF has extracted text
2. Check PDF upload was successful
3. Verify `pdfId` is being passed
4. Check backend logs for PDF context errors

## 🎯 Usage Tips

### Best Questions to Ask

**For Summaries:**
- "Summarize the key points"
- "What are the main takeaways?"
- "Give me an overview of this document"

**For Explanations:**
- "Explain [concept] in simple terms"
- "How does [topic] work?"
- "What is [term] mentioned in the document?"

**For Study Help:**
- "What should I focus on?"
- "Help me understand [section]"
- "What are the important concepts?"

### Features to Try

1. **Quick Actions**: Click suggestion chips for instant questions
2. **Conversation Flow**: Ask follow-up questions for context
3. **Real-time Typing**: See responses as they generate
4. **Message History**: Previous conversations are saved

## 🎨 Visual Indicators

### Connection Status
- **🟢 Green Pulsing Dot**: Connected to real-time AI
- **🔴 Red Dot**: Disconnected (using REST fallback)

### Message States
- **Typing Dots**: AI is thinking
- **Blinking Cursor |**: AI is generating response
- **Complete Message**: Response finished

### Quick Actions
- Show after first few messages
- Disable during AI response
- One-click common questions

## 📱 Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Brave

## 🔐 Security Notes

- JWT authentication required for all socket connections
- Messages are user-specific (no cross-user access)
- PDF access controlled by ownership
- API keys stored in environment variables only

## 📈 Performance Tips

For best performance:
1. Use Chrome-based browsers
2. Ensure stable internet connection
3. Keep PDF sizes reasonable (<50MB)
4. Limit conversation history (auto-managed)
5. Close unused PDF tabs

## 🆘 Getting Help

If issues persist:

1. **Check Console Logs**:
   - Browser DevTools → Console
   - Look for errors or warnings

2. **Check Backend Logs**:
   - Terminal running `npm run dev`
   - Look for connection/generation errors

3. **Verify Configuration**:
   - `.env` file has all required variables
   - API keys are valid and active
   - MongoDB is running and accessible

4. **Test Components Individually**:
   - Test REST API: POST to `/api/chat/send`
   - Test Socket.io: Check WebSocket in Network tab
   - Test LLM: Check backend can generate responses

## 🎉 Success Checklist

- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] Green connection indicator
- [ ] Can send messages
- [ ] Responses stream in real-time
- [ ] AI references PDF content
- [ ] Message history persists
- [ ] Quick actions work
- [ ] Typing indicators show

## 🚀 Next Steps

Once everything is working:

1. **Try Different PDFs**: Test with various document types
2. **Explore Features**: Use quick actions and suggestions
3. **Build Conversations**: Ask follow-up questions
4. **Check Dashboard**: See analytics on usage
5. **Test Mobile**: Try on mobile devices

## 🎬 Demo Script

Quick demo to show off the feature:

1. Upload a PDF about a technical topic
2. Open the PDF viewer
3. Click on AI Pdf Buddy
4. Point out the green connection indicator
5. Click "📝 Summarize key points"
6. Watch the response stream live
7. Ask a follow-up question
8. Show conversation history
9. Demonstrate quick actions
10. Check typing indicators

## 📚 Additional Resources

- **Full Documentation**: See `REALTIME_AI_ASSISTANT.md`
- **Socket.io Docs**: https://socket.io/docs/
- **Gemini API**: https://ai.google.dev/docs
- **OpenAI API**: https://platform.openai.com/docs

## 💡 Pro Tips

1. **Be Specific**: More specific questions get better answers
2. **Use Context**: Reference page numbers or sections
3. **Ask Follow-ups**: Build on previous answers
4. **Try Suggestions**: Use built-in quick actions
5. **Check Connection**: Green dot means better responses

---

**Enjoy your real-time AI Pdf Buddy! 🤖✨**
