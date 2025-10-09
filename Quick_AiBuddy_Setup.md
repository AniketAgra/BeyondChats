# 🚀 Quick Setup Guide - AI Study Buddy with Pinecone RAG

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install @pinecone-database/pinecone
```

## Step 2: Configure Environment Variables

Edit `backend/.env` and add:

```bash
# Pinecone Configuration
PINECONE_API_KEY=your_api_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=edulearn-vectors

# Make sure these exist
OPENAI_API_KEY=your_openai_key_here
MONGO_URI=mongodb://localhost:27017/edulearn
```

## Step 3: Create Pinecone Index

1. Go to https://www.pinecone.io/
2. Create account (free tier available)
3. Create new index:
   - **Name:** `edulearn-vectors`
   - **Dimensions:** 1536 (for OpenAI ada-002)
   - **Metric:** cosine
   - **Environment:** us-east-1 (or your chosen region)

## Step 4: Initialize Database Collections

The new schemas will auto-create when first used:
- `chatsessions` - Chat session management
- `sessionmessages` - Messages within sessions

## Step 5: Restart Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ Pinecone client initialized
✅ Chat Memory Service initialized
Mongo connected
API on http://localhost:4000
```

## Step 6: Test Frontend

```bash
cd frontend
npm run dev
```

Navigate to: `http://localhost:5173/aibuddy`

## Step 7: Verify Setup

### Test Checklist:
1. ✅ Click "New Chat" button
2. ✅ Send a test message
3. ✅ See typing indicator
4. ✅ Receive AI response
5. ✅ Try renaming chat
6. ✅ Create multiple chats
7. ✅ Switch between chats

## Common Issues

### Issue: "Pinecone not initialized"
**Fix:** Check API key in `.env`, restart backend

### Issue: "Failed to create session"
**Fix:** Verify MongoDB is running

### Issue: "Sidebar not showing"
**Fix:** Clear browser cache, check console for errors

## What's Working

✅ Chat session management  
✅ Separate PDF and general chats  
✅ Message history per session  
✅ Rename/delete sessions  
✅ Beautiful ChatGPT-style UI  
✅ Performance-aware context  

## What Needs Pinecone Setup

🔄 Vector search for RAG  
🔄 PDF chunk embeddings  
🔄 Quiz performance vectors  
🔄 Context retrieval  

*Until Pinecone is configured, the system will work with basic AI responses without RAG enhancement.*

## Next: Implement PDF Embedding Pipeline

Once Pinecone is working, we'll:
1. Auto-generate embeddings on PDF upload
2. Store quiz performance as vectors
3. Enable full RAG queries
4. Add performance-based recommendations

---

**Ready to test!** 🎉
