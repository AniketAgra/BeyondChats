# 🛠️ EduLearn - Tech Stack

## Complete Technology Overview

---

## 🎨 Frontend

### Core Framework
- **React 18.3.1** - UI library with hooks and context
- **Vite 5.4.1** - Fast build tool and dev server with HMR
- **React Router DOM 6.26.2** - Client-side routing

### State Management
- **React Context API** - Global state (Auth, Theme)
- **React Hooks** - Local component state (useState, useEffect, useReducer)
- **Custom Hooks** - `useChatSocket` for WebSocket management

### UI Components & Styling
- **CSS Modules** - Scoped component styling
- **CSS Variables** - Theme system (light/dark mode)
- **Recharts 2.10.3** - Data visualization (charts, graphs)
- **React Icons 5.5.0** - Icon library

### PDF Handling
- **react-pdf 7.7.1** - PDF rendering in browser
- **pdfjs-dist** - Underlying PDF.js library

### HTTP & Real-Time
- **Axios 1.7.2** - HTTP client for REST APIs
- **Socket.IO Client 4.8.1** - WebSocket for real-time chat

### Build & Development
- **@vitejs/plugin-react 4.3.2** - React support for Vite
- **ESLint** - Code linting (optional)

---

## ⚙️ Backend

### Core Framework
- **Node.js 18+** - JavaScript runtime
- **Express 4.19.2** - Web application framework
- **Socket.IO 4.8.1** - Real-time bidirectional communication

### Database
- **MongoDB 8.5.1 (Mongoose)** - NoSQL database with ODM
- **MongoDB Atlas** - Cloud-hosted MongoDB (production)

### Authentication & Security
- **jsonwebtoken 9.0.2** - JWT token generation/verification
- **bcryptjs 2.4.3** - Password hashing
- **cookie-parser 1.4.6** - Parse HTTP cookies
- **cors 2.8.5** - Cross-Origin Resource Sharing

### AI & Machine Learning
- **@google/genai 1.23.0** - Google Gemini API client
- **openai 6.2.0** - OpenAI GPT API client
- **@pinecone-database/pinecone 6.1.2** - Vector database for RAG

### File Handling
- **multer 1.4.5-lts.1** - Multipart/form-data for file uploads
- **pdf-parse 1.1.1** - Extract text from PDFs
- **pdfjs-dist 4.5.136** - PDF parsing (server-side)
- **mime-types 2.1.35** - MIME type detection

### Storage
- **@supabase/supabase-js 2.45.4** - Supabase client for file storage

### HTTP Client
- **axios 1.7.2** - HTTP requests to external APIs

### Development
- **nodemon 3.1.0** - Auto-restart server on file changes
- **dotenv 16.4.5** - Environment variable management
- **eslint 9.10.0** - Code linting

---

## 🗄️ Databases & Storage

### Primary Database
- **MongoDB**
  - Version: 6+
  - Collections: users, pdfs, quizzes, quizAttempts, chatSessions, sessionMessages, notes, topics, topicPerformance, keyFeatures
  - Hosting: MongoDB Atlas (production) or local (development)

### Vector Database
- **Pinecone**
  - Index: `edulearn-vectors`
  - Dimension: 1536 (OpenAI embeddings)
  - Metric: Cosine similarity
  - Use case: RAG for AI Study Buddy

### File Storage
- **Supabase Storage**
  - Bucket: `edulearn-pdfs`
  - File type: PDF documents
  - Access: Signed URLs with expiration

---

## 🤖 AI Services

### Primary LLM
- **Google Gemini**
  - Model: `gemini-2.0-flash-exp` or `gemini-1.5-flash`
  - Use cases:
    - PDF summarization
    - Quiz generation
    - AI PDF Buddy responses
    - AI Study Buddy responses
  - Streaming: Native support

### Fallback LLM
- **OpenAI GPT**
  - Models: `gpt-4o-mini`, `gpt-3.5-turbo`
  - Use cases: Same as Gemini (when configured as primary)
  - Streaming: SSE (Server-Sent Events)

### Embeddings
- **OpenAI Embeddings**
  - Model: `text-embedding-ada-002`
  - Dimension: 1536
  - Use case: Convert text to vectors for Pinecone storage

---

## 🔧 External APIs

### YouTube Data API v3
- **Use case:** Fetch educational video recommendations
- **Endpoint:** `/youtube/v3/search`
- **Optional:** Works with mock data if key not provided

### Future Integrations
- **Sentry** - Error tracking and monitoring
- **Stripe** - Payment processing (for premium features)
- **SendGrid** - Email notifications

---

## 🏗️ Architecture Patterns

### Backend Design Patterns
- **MVC (Model-View-Controller)** - Separation of concerns
- **Service Layer Pattern** - Business logic in services
- **Middleware Pattern** - Request processing pipeline
- **Repository Pattern** - Data access abstraction (Mongoose schemas)

### Frontend Design Patterns
- **Component-Based Architecture** - Reusable UI components
- **Container/Presentational** - Smart vs dumb components
- **Custom Hooks** - Reusable stateful logic
- **Context API** - Global state management

---

## 🔐 Security Stack

### Authentication
- **JWT (JSON Web Tokens)**
  - Access tokens: 15-minute expiry
  - Refresh tokens: 7-day expiry, httpOnly cookies
- **bcrypt** - Password hashing with salt rounds

### API Security
- **CORS** - Configured for specific frontend origin
- **Input Validation** - Request body validation
- **Environment Variables** - Secrets stored in `.env`

---

## 🚀 Deployment Stack

### Recommended Production Setup

**Frontend:**
- **Vercel** or **Netlify**
  - Automatic CI/CD from Git
  - Global CDN
  - Free SSL certificates
  - Serverless functions support

**Backend:**
- **Render.com** or **Railway.app**
  - Easy Node.js deployment
  - Free tier available
  - Automatic HTTPS
  - Environment variable management

Alternative: **AWS EC2** or **DigitalOcean Droplets**
  - Full control
  - Requires manual setup (Nginx, PM2, SSL)

**Database:**
- **MongoDB Atlas** (free tier: 512MB)
  - Managed MongoDB
  - Automated backups
  - Global clusters
  - Built-in monitoring

**Storage:**
- **Supabase Storage** (free tier: 1GB)
  - S3-compatible API
  - Built-in CDN
  - Row-level security

**Vector Database:**
- **Pinecone** (free tier: 1 index, 100K vectors)
  - Fully managed
  - Low latency
  - Auto-scaling

---

## 📦 Package Managers

- **npm** (Node Package Manager) - Default package manager
- **yarn** or **pnpm** - Alternative package managers (optional)

---

## 🧪 Testing (Future Implementation)

### Frontend
- **Vitest** - Unit testing (Vite-native)
- **React Testing Library** - Component testing
- **Cypress** or **Playwright** - E2E testing

### Backend
- **Jest** - Unit and integration testing
- **Supertest** - API endpoint testing
- **MongoDB Memory Server** - In-memory DB for tests

---

## 📊 Monitoring & Analytics (Future)

### Error Tracking
- **Sentry** - Real-time error monitoring
- **LogRocket** - Session replay

### Performance Monitoring
- **New Relic** or **Datadog** - APM
- **Google Analytics** - User analytics

### Logging
- **Winston** or **Pino** - Structured logging
- **Logtail** - Log aggregation

---

## 🔄 Version Control & CI/CD

### Version Control
- **Git** - Source code management
- **GitHub** - Code hosting and collaboration

### CI/CD (Future)
- **GitHub Actions** - Automated workflows
- **Vercel/Render** - Auto-deploy on push

---

## 📚 Development Tools

### Code Editors
- **VS Code** (Recommended)
  - Extensions: ESLint, Prettier, MongoDB, Thunder Client

### API Testing
- **Postman** or **Insomnia** - API endpoint testing
- **Thunder Client** - VS Code extension

### Database Management
- **MongoDB Compass** - Visual MongoDB client
- **Studio 3T** - Advanced MongoDB IDE

### Design & Assets
- **Figma** - UI/UX design (if applicable)
- **Canva** - Graphics and icons

---

## 🌐 Browser Compatibility

### Supported Browsers
- **Chrome 90+**
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**

### Mobile Browsers
- **Chrome Mobile**
- **Safari iOS**

---

## 📦 Dependency Summary

### Frontend Dependencies (12)
```json
{
  "axios": "^1.7.2",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-icons": "^5.5.0",
  "react-pdf": "^7.7.1",
  "react-router-dom": "^6.26.2",
  "recharts": "^2.10.3",
  "socket.io-client": "^4.8.1"
}
```

### Backend Dependencies (20)
```json
{
  "@google/genai": "^1.23.0",
  "@pinecone-database/pinecone": "^6.1.2",
  "@supabase/supabase-js": "^2.45.4",
  "axios": "^1.7.2",
  "bcryptjs": "^2.4.3",
  "cookie-parser": "^1.4.6",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "jsonwebtoken": "^9.0.2",
  "mime-types": "^2.1.35",
  "mongoose": "^8.5.1",
  "multer": "^1.4.5-lts.1",
  "openai": "^6.2.0",
  "pdf-parse": "^1.1.1",
  "pdfjs-dist": "^4.5.136",
  "socket.io": "^4.8.1"
}
```

---

## 🔗 Official Documentation Links

### Frontend
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Recharts](https://recharts.org/)

### Backend
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [Socket.IO](https://socket.io/)

### Databases & Storage
- [MongoDB](https://www.mongodb.com/docs/)
- [Supabase](https://supabase.com/docs)
- [Pinecone](https://docs.pinecone.io/)

### AI Services
- [Google Gemini](https://ai.google.dev/)
- [OpenAI](https://platform.openai.com/docs)

---

## 📈 Scalability Considerations

### Current Stack Limitations
- Single server instance (no horizontal scaling)
- Stateful WebSocket connections
- No caching layer

### Scaling Recommendations
1. **Add Redis** - For caching and Socket.IO adapter
2. **Implement Queue System** - Bull or RabbitMQ for background jobs
3. **Load Balancer** - Nginx or AWS ELB for multiple instances
4. **CDN** - CloudFlare or AWS CloudFront for static assets
5. **Database Replication** - MongoDB replica sets

---

## 🎯 Future Tech Stack Additions

### Planned Enhancements
- **TypeScript** - Type safety across codebase
- **GraphQL** - Alternative to REST APIs
- **Redis** - Caching and session store
- **Docker** - Containerization for consistent deployments
- **Kubernetes** - Container orchestration (at scale)

---

**Last Updated:** October 2025  
**Version:** 1.0.0
