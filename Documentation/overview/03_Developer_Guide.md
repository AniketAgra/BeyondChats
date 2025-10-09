# 🛠️ EduLearn - Developer Guide

## Prerequisites

Before setting up EduLearn, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Installation Guide](https://www.mongodb.com/docs/manual/installation/)
- **Git** - [Download](https://git-scm.com/downloads)
- **Code Editor** - VS Code recommended

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BeyondChats
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/edulearn
ORIGIN=http://localhost:5173

# Required for AI features
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Required for PDF storage
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
SUPABASE_BUCKET=edulearn-pdfs

# Required for AI Study Buddy
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=edulearn-vectors

# Authentication secrets
JWT_ACCESS_TOKEN_SECRET=your_random_access_secret
JWT_REFRESH_TOKEN_SECRET=your_random_refresh_secret
```

Start the backend:
```bash
npm run dev
```

Backend runs on `http://localhost:4000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Access the Application

Open browser and navigate to:
```
http://localhost:5173
```

Create an account and start using EduLearn! 🎉

---

## 📋 Detailed Setup

### Environment Variables Explained

#### Backend `.env`

**Server Configuration:**
```env
PORT=4000                              # Backend server port
MONGO_URI=mongodb://localhost:27017/edulearn  # MongoDB connection string
ORIGIN=http://localhost:5173           # Frontend URL for CORS
```

**AI Configuration:**
```env
LLM_PROVIDER=gemini                    # Primary LLM: 'gemini' or 'openai'
GEMINI_API_KEY=                        # Get from Google AI Studio
OPENAI_API_KEY=                        # Get from OpenAI Platform
```

**Storage Configuration:**
```env
SUPABASE_URL=                          # Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=             # Service role key (not anon key!)
SUPABASE_BUCKET=edulearn-pdfs          # Bucket name in Supabase Storage
MAX_UPLOAD_BYTES=52428800              # 50MB upload limit
```

**Vector Database (Pinecone):**
```env
PINECONE_API_KEY=                      # Get from Pinecone dashboard
PINECONE_ENVIRONMENT=us-east-1         # Your Pinecone environment
PINECONE_INDEX_NAME=edulearn-vectors   # Index name (create if doesn't exist)
```

**Authentication:**
```env
JWT_ACCESS_TOKEN_SECRET=your_secret_here      # Generate random string
JWT_REFRESH_TOKEN_SECRET=another_secret_here  # Different from access
```

**Optional:**
```env
ENABLE_DEBUG_ROUTES=true               # Enable /api/debug and /api/test routes
YOUTUBE_API_KEY=                       # For video suggestions (optional)
```

---

## 🔑 Getting API Keys

### 1. Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to `GEMINI_API_KEY`

### 2. OpenAI API

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy to `OPENAI_API_KEY`

### 3. Supabase

1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Go to **Settings → API**
   - Copy `URL` to `SUPABASE_URL`
   - Copy `service_role` key to `SUPABASE_SERVICE_ROLE_KEY` (not anon key!)
4. Go to **Storage**
   - Create bucket named `edulearn-pdfs`
   - Make it public or configure signed URLs

### 4. Pinecone

1. Sign up at [Pinecone](https://www.pinecone.io/)
2. Create index with:
   - Name: `edulearn-vectors`
   - Dimension: `1536`
   - Metric: `cosine`
3. Copy API key from dashboard to `PINECONE_API_KEY`
4. Note environment (e.g., `us-east-1`) for `PINECONE_ENVIRONMENT`

---

## 🗄️ Database Setup

### MongoDB Installation

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Windows:**
Download installer from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### Verify MongoDB

```bash
mongosh
> show dbs
> use edulearn
> db.users.find()
```

### MongoDB Compass (GUI)

Download [MongoDB Compass](https://www.mongodb.com/products/compass) for visual database management.

Connection string: `mongodb://localhost:27017`

---

## 📦 NPM Scripts

### Backend

```bash
npm run dev        # Start with nodemon (auto-restart on changes)
npm start          # Start production server
npm run lint       # Run ESLint
```

### Frontend

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Build for production (outputs to dist/)
npm run preview    # Preview production build locally
```

---

## 🧪 Testing the Setup

### 1. Health Check

```bash
curl http://localhost:4000/api/health
# Expected: {"ok":true}
```

### 2. Test PDF Upload

1. Go to `http://localhost:5173/library`
2. Click "Upload PDF"
3. Select a PDF file
4. Verify it appears in the library

### 3. Test AI Chat

1. Open the uploaded PDF
2. Click on "Chat" tab
3. Type "Summarize this PDF"
4. Verify AI response appears

### 4. Test Quiz Generation

1. In PDF view, click "Generate Quiz"
2. Select difficulty and question types
3. Click "Generate"
4. Take the quiz and submit
5. Check results display

---

## 🐛 Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongodb  # Linux
brew services list  # macOS

# Start MongoDB
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

### Issue: CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
- Ensure `ORIGIN` in backend `.env` matches frontend URL
- Restart backend server after changing `.env`

### Issue: Supabase Upload Fails

**Error:** `Failed to upload PDF to Supabase`

**Solution:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is service role (not anon key)
- Check bucket exists and is configured correctly
- Ensure bucket policy allows uploads

### Issue: AI Responses Not Generating

**Error:** `API key not valid`

**Solution:**
- Verify `GEMINI_API_KEY` or `OPENAI_API_KEY` is correct
- Check API key has not expired
- Ensure you have quota/credits remaining

### Issue: Pinecone Vector Search Fails

**Error:** `PineconeClient is not initialized`

**Solution:**
- Verify `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`
- Ensure index exists with dimension 1536
- Check network connectivity to Pinecone

### Issue: JWT Token Expired

**Error:** `Token expired`

**Solution:**
- Frontend automatically refreshes tokens
- If persists, logout and login again
- Check JWT secrets in `.env` are consistent

---

## 📁 Project Structure

### Backend Directory Tree

```
Backend/
├── src/
│   ├── app.js                    # Express app setup
│   ├── server.js                 # Server entry point
│   ├── routes/                   # API route handlers
│   │   ├── auth.js
│   │   ├── pdf.js
│   │   ├── pdfRoutes.js
│   │   ├── quiz.js
│   │   ├── analytics.js
│   │   ├── aibuddy.js
│   │   ├── chat.js
│   │   ├── notes.js
│   │   └── keyFeatures.js
│   ├── controllers/              # Business logic
│   │   └── pdfController.js
│   ├── services/                 # Core services
│   │   ├── pdfService.js
│   │   ├── quizService.js
│   │   ├── aiStudyBuddy.service.js
│   │   ├── pdfAssistant.service.js
│   │   └── vector.service.js
│   ├── schemas/                  # MongoDB models
│   │   ├── User.js
│   │   ├── Pdf.js
│   │   ├── Quiz.js
│   │   ├── QuizAttempt.js
│   │   ├── ChatSession.js
│   │   ├── SessionMessage.js
│   │   └── ...
│   ├── middlewares/              # Express middlewares
│   │   └── auth.js
│   ├── sockets/                  # Socket.IO handlers
│   │   └── chatSocket.js
│   └── config/                   # Configuration files
│       ├── db.js
│       ├── supabase.js
│       └── pinecone.js
├── .env                          # Environment variables (create from .env.example)
├── .env.example                  # Template for .env
├── package.json
└── server.js                     # Server entry point
```

### Frontend Directory Tree

```
Frontend/
├── src/
│   ├── pages/                    # Route components
│   │   ├── DashboardPage.jsx
│   │   ├── LibraryPage.jsx
│   │   ├── PDFPage.jsx
│   │   ├── QuizPage.jsx
│   │   ├── QuizzesHistoryPage.jsx
│   │   ├── AIBuddyPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── SignupPage.jsx
│   ├── components/               # Reusable components
│   │   ├── Navbar/
│   │   ├── Sidebar/
│   │   ├── ChatPanel/
│   │   ├── ChatSidebar/
│   │   ├── PDFViewer/
│   │   ├── NotesPanel/
│   │   ├── RightPanel/
│   │   ├── Quiz/
│   │   ├── Dashboard/
│   │   └── AIBuddy/
│   ├── context/                  # React Context
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/                    # Custom hooks
│   │   └── useChatSocket.js
│   ├── utils/                    # Utilities
│   │   └── api.js
│   ├── theme.css                 # Global CSS variables
│   ├── App.jsx                   # Main app component
│   └── index.jsx                 # Entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## 🔄 Development Workflow

### 1. Create a New Feature

```bash
git checkout -b feature/your-feature-name
```

### 2. Backend Development

1. Create route in `src/routes/`
2. Add controller logic in `src/controllers/` or `src/services/`
3. Test endpoint with Postman or curl
4. Add authentication if needed (`requireAuth` middleware)

### 3. Frontend Development

1. Create component in `src/components/`
2. Add page in `src/pages/` if new route
3. Update `App.jsx` with new route
4. Style with CSS modules (`.module.css`)

### 4. Testing

```bash
# Backend
curl -X POST http://localhost:4000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'

# Frontend
# Use browser DevTools → Network tab to inspect requests
```

### 5. Commit and Push

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

---

## 🎨 Styling Guidelines

### CSS Modules

Components use CSS Modules for scoped styling:

```jsx
// Component.jsx
import styles from './Component.module.css'

function Component() {
  return <div className={styles.container}>Content</div>
}
```

### Theme Variables

Global theme variables in `src/theme.css`:

```css
:root {
  --primary-color: #6366f1;
  --background: #ffffff;
  --text: #1f2937;
}

[data-theme="dark"] {
  --background: #111827;
  --text: #f9fafb;
}
```

Access in components:
```css
.container {
  background: var(--background);
  color: var(--text);
}
```

---

## 🔌 API Development

### Adding a New Endpoint

**Step 1:** Create route file or add to existing

```javascript
// src/routes/example.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    // Your logic here
    const userId = req.user._id;
    res.json({ success: true, data: {} });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
```

**Step 2:** Register in `src/app.js`

```javascript
import exampleRouter from './routes/example.js';
app.use('/api/example', exampleRouter);
```

**Step 3:** Add frontend API function

```javascript
// Frontend/src/utils/api.js
export const exampleApi = {
  getData: async () => (await api.get('/example')).data
};
```

---

## 🧩 Adding New Dependencies

### Backend

```bash
cd Backend
npm install package-name
```

Update `package.json` and commit.

### Frontend

```bash
cd Frontend
npm install package-name
```

For UI libraries, prefer lightweight options compatible with React 18.

---

## 📊 Debugging

### Backend Logs

```bash
# Terminal shows server logs
# Add debug logs:
console.log('Debug:', variable);
```

### Frontend Debugging

- Use React DevTools browser extension
- Check browser Console for errors
- Use Network tab to inspect API calls

### MongoDB Queries

```bash
mongosh edulearn
> db.pdfs.find({ user: ObjectId('...') })
> db.quizAttempts.countDocuments()
```

---

## 🚀 Production Considerations

Before deploying:

1. **Environment Variables:**
   - Use production database URL
   - Change JWT secrets to strong random values
   - Set `ORIGIN` to production frontend URL

2. **Build Frontend:**
   ```bash
   cd Frontend
   npm run build
   ```

3. **Security:**
   - Set `ENABLE_DEBUG_ROUTES=false`
   - Enable rate limiting (future enhancement)
   - Use HTTPS in production

4. **Performance:**
   - MongoDB indexes on frequently queried fields
   - Enable compression middleware
   - Use CDN for static assets

See [04_Deployment_Guide.md](./04_Deployment_Guide.md) for detailed production setup.

---

## 📖 Additional Resources

- [System Architecture](./02_System_Architecture.md)
- [API Endpoints Reference](../api/api_endpoints.md)
- [Service Integrations](../services/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)

---

## 🤝 Getting Help

**Documentation Issues:**
- Check other documentation files in `/documentation`
- Review error logs carefully

**Code Issues:**
- Use `console.log` for debugging
- Check browser DevTools
- Review MongoDB data with Compass

**API Integration:**
- Test with Postman/curl first
- Verify API keys are valid
- Check service status pages

---

**Last Updated:** October 2025  
**Version:** 1.0.0
