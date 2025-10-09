# 🌐 API Endpoints Reference

## Base URL

**Development:** `http://localhost:4000/api`  
**Production:** `https://beyondchats-cbtm.onrender.com/api`

---

## Authentication

Most endpoints require JWT authentication via Bearer token in Authorization header.

```http
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use refresh endpoint to get new tokens.

---

## 📑 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [PDF Management](#pdf-endpoints)
3. [Quiz System](#quiz-endpoints)
4. [Chat & AI](#chat-endpoints)
5. [Analytics](#analytics-endpoints)
6. [Notes](#notes-endpoints)
7. [AI Study Buddy](#ai-study-buddy-endpoints)

---

## 🔐 Authentication Endpoints

### POST /auth/signup

Create new user account.

**Request:**
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "username": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "user123",
    "email": "student@example.com",
    "username": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..." // Also set as httpOnly cookie
}
```

**Errors:**
- `400` - Email already exists
- `400` - Missing required fields

---

### POST /auth/login

Authenticate existing user.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "_id": "user123",
    "email": "student@example.com",
    "username": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401` - Invalid credentials
- `400` - Missing fields

---

### POST /auth/refresh

Get new access token using refresh token.

**Request:**
```http
POST /api/auth/refresh
Cookie: refreshToken=<token>
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### POST /auth/logout

Invalidate refresh token.

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/me

Get current authenticated user.

**Request:**
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user": {
    "_id": "user123",
    "email": "student@example.com",
    "username": "John Doe",
    "createdAt": "2025-10-01T00:00:00Z"
  }
}
```

---

## 📄 PDF Endpoints

### POST /pdf/upload

Upload and process a new PDF file.

**Request:**
```http
POST /api/pdf/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <binary PDF data>
title: "Physics Class XI" (optional)
author: "NCERT" (optional)
```

**Response (201):**
```json
{
  "success": true,
  "pdf": {
    "_id": "pdf123",
    "user": "user123",
    "url": "https://supabase.co/storage/edulearn-pdfs/abc.pdf",
    "filename": "physics_xi.pdf",
    "title": "Physics Class XI",
    "author": "NCERT",
    "size": 2048576,
    "summary": "This textbook covers fundamental physics concepts...",
    "chapters": ["Motion", "Forces", "Energy"],
    "uploadedAt": "2025-10-09T10:00:00Z",
    "createdAt": "2025-10-09T10:00:00Z"
  }
}
```

**Errors:**
- `400` - No file provided
- `400` - File too large (>50MB)
- `500` - Upload or processing failed

---

### GET /pdf

List all PDFs for authenticated user.

**Request:**
```http
GET /api/pdf
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "pdf123",
      "url": "https://supabase.co/storage/...",
      "filename": "physics_xi.pdf",
      "title": "Physics Class XI",
      "author": "NCERT",
      "size": 2048576,
      "uploadedAt": "2025-10-09T10:00:00Z",
      "createdAt": "2025-10-09T10:00:00Z"
    }
  ]
}
```

---

### GET /pdf/:id

Get specific PDF details.

**Request:**
```http
GET /api/pdf/abc123
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "_id": "pdf123",
  "url": "https://supabase.co/storage/...",
  "filename": "physics_xi.pdf",
  "title": "Physics Class XI",
  "summary": "Comprehensive physics textbook...",
  "chapters": ["Motion", "Forces"],
  "uploadedAt": "2025-10-09T10:00:00Z"
}
```

**Errors:**
- `404` - PDF not found or access denied

---

### DELETE /pdf/:id

Delete PDF and all associated data.

**Request:**
```http
DELETE /api/pdf/abc123
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "PDF and related data deleted successfully"
}
```

**Note:** Deletes PDF file from Supabase, and removes related data: notes, chat messages, quizzes, quiz attempts, topics, and key features.

**Errors:**
- `404` - PDF not found
- `500` - Deletion failed

---

## 🧩 Quiz Endpoints

### POST /quiz/generate

Generate quiz from PDF or text content.

**Request:**
```http
POST /api/quiz/generate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "pdfId": "pdf123",
  "difficulty": "medium",
  "types": ["MCQ", "SAQ"],
  "topic": "Newton's Laws",
  "count": 10,
  "reuseQuizId": "quiz456" // Optional: reuse existing quiz
}
```

**Parameters:**
- `pdfId` (optional) - PDF to generate from
- `text` (optional) - Custom text content (if no pdfId)
- `difficulty` - "easy" | "medium" | "hard"
- `types` - Array of "MCQ", "SAQ", "LAQ"
- `topic` (optional) - Specific topic focus
- `count` - Number of questions (default: 10)
- `reuseQuizId` (optional) - Return existing quiz for reattempt

**Response (200):**
```json
{
  "quizId": "quiz789",
  "difficulty": "medium",
  "types": ["MCQ", "SAQ"],
  "topic": "Newton's Laws",
  "questions": [
    {
      "type": "MCQ",
      "question": "What is Newton's First Law?",
      "options": [
        "An object at rest stays at rest",
        "Force equals mass times acceleration",
        "Every action has an equal reaction",
        "None of the above"
      ]
    },
    {
      "type": "SAQ",
      "question": "Explain the concept of inertia."
    }
  ],
  "isReattempt": false
}
```

**Note:** `correctAnswer` is NOT included in response. Stored server-side for grading.

**Errors:**
- `400` - Invalid pdfId format
- `404` - PDF not found
- `500` - Quiz generation failed

---

### POST /quiz/submit

Submit quiz answers for grading.

**Request:**
```http
POST /api/quiz/submit
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quizId": "quiz789",
  "pdfId": "pdf123",
  "topic": "Newton's Laws",
  "difficulty": "medium",
  "questions": [
    {
      "type": "MCQ",
      "question": "...",
      "correctAnswer": "A"
    }
  ],
  "responses": [
    { "questionIndex": 0, "userAnswer": "A" },
    { "questionIndex": 1, "userAnswer": "Inertia is..." }
  ]
}
```

**Response (200):**
```json
{
  "score": 85,
  "correct": 8,
  "total": 10,
  "results": [
    {
      "questionIndex": 0,
      "isCorrect": true,
      "userAnswer": "A",
      "correctAnswer": "A",
      "feedback": "Correct!"
    },
    {
      "questionIndex": 1,
      "isCorrect": true,
      "userAnswer": "Inertia is...",
      "correctAnswer": "Inertia is the tendency...",
      "feedback": "Good explanation"
    }
  ]
}
```

**Side Effects:**
- Creates `QuizAttempt` record
- Updates `TopicPerformance` for user
- Stores in Pinecone for AI Study Buddy context

**Errors:**
- `400` - Missing required fields
- `500` - Submission failed

---

### GET /quiz/attempts

Get user's quiz history.

**Request:**
```http
GET /api/quiz/attempts?pdfId=pdf123&limit=50
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `pdfId` (optional) - Filter by PDF
- `limit` (optional) - Number of results (default: 50)

**Response (200):**
```json
{
  "attempts": [
    {
      "_id": "attempt123",
      "user": "user123",
      "quiz": "quiz789",
      "pdf": {
        "title": "Physics Class XI",
        "filename": "physics_xi.pdf"
      },
      "topic": "Newton's Laws",
      "difficulty": "medium",
      "score": 85,
      "correct": 8,
      "total": 10,
      "timeTaken": 450,
      "createdAt": "2025-10-09T10:00:00Z"
    }
  ]
}
```

---

### GET /quiz/attempts/:id

Get specific quiz attempt with full details.

**Request:**
```http
GET /api/quiz/attempts/attempt123
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "attempt": {
    "_id": "attempt123",
    "quiz": "quiz789",
    "pdf": { "title": "Physics XI" },
    "topic": "Newton's Laws",
    "score": 85,
    "correct": 8,
    "total": 10,
    "responses": [
      {
        "questionIndex": 0,
        "userAnswer": "A",
        "correctAnswer": "A",
        "isCorrect": true
      }
    ],
    "createdAt": "2025-10-09T10:00:00Z"
  }
}
```

---

### GET /quiz/quiz/:id

Get quiz details for reattempt (includes questions, NOT answers).

**Request:**
```http
GET /api/quiz/quiz/quiz789
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "quiz": {
    "_id": "quiz789",
    "difficulty": "medium",
    "types": ["MCQ", "SAQ"],
    "topic": "Newton's Laws",
    "questions": [
      {
        "type": "MCQ",
        "question": "...",
        "options": ["A", "B", "C", "D"]
      }
    ],
    "totalQuestions": 10,
    "createdAt": "2025-10-08T10:00:00Z"
  }
}
```

---

### GET /quiz/quizzes

List all quizzes (for history/library).

**Request:**
```http
GET /api/quiz/quizzes?pdfId=pdf123
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "quizzes": [
    {
      "_id": "quiz789",
      "topic": "Newton's Laws",
      "difficulty": "medium",
      "types": ["MCQ", "SAQ"],
      "totalQuestions": 10,
      "pdf": { "title": "Physics XI" },
      "createdAt": "2025-10-08T10:00:00Z"
    }
  ]
}
```

---

## 💬 Chat Endpoints

### GET /chat

Get chat history (REST fallback, prefer WebSocket).

**Request:**
```http
GET /api/chat?pdfId=pdf123&limit=50
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "user": "user123",
      "role": "user",
      "content": "What is Newton's First Law?",
      "pdfId": "pdf123",
      "createdAt": "2025-10-09T10:00:00Z"
    },
    {
      "_id": "msg124",
      "role": "ai",
      "content": "Newton's First Law states...",
      "pdfId": "pdf123",
      "createdAt": "2025-10-09T10:00:05Z"
    }
  ]
}
```

---

### POST /chat/send

Send chat message (REST fallback, prefer WebSocket).

**Request:**
```http
POST /api/chat/send
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Explain inertia",
  "pdfId": "pdf123",
  "conversationHistory": []
}
```

**Response (200):**
```json
{
  "userMessage": {
    "_id": "msg125",
    "role": "user",
    "content": "Explain inertia",
    "createdAt": "2025-10-09T10:05:00Z"
  },
  "aiResponse": {
    "_id": "msg126",
    "role": "ai",
    "content": "Inertia is the property of matter...",
    "createdAt": "2025-10-09T10:05:05Z"
  }
}
```

---

## 📊 Analytics Endpoints

### GET /analytics/overview

Get comprehensive dashboard data.

**Request:**
```http
GET /api/analytics/overview
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "overview": {
    "totalStudyHours": "12.5",
    "totalQuizzes": 45,
    "averageScore": "76.8",
    "streak": 7,
    "learningLevel": {
      "level": "Scholar",
      "icon": "🎓",
      "color": "#8b5cf6"
    }
  },
  "topPdf": {
    "id": "pdf123",
    "title": "Physics XI",
    "attempts": 15,
    "avgScore": "82.0"
  },
  "topTopics": [
    { "topic": "Newton's Laws", "avgScore": "88.5", "attempts": 12 }
  ],
  "weakTopics": [
    { "topic": "Thermodynamics", "avgScore": "52.3", "attempts": 8 }
  ],
  "performanceTrend": [
    { "date": "Oct 1", "score": 75, "topic": "Motion", "quizId": "xyz" }
  ],
  "recentActivity": [
    {
      "date": "2025-10-09T10:30:00Z",
      "topic": "Gravitation",
      "types": ["MCQ"],
      "score": "8/10",
      "accuracy": 80,
      "timeTaken": "7m 30s"
    }
  ]
}
```

---

### GET /analytics/topic-mastery

Get topic mastery heatmap data.

**Response (200):**
```json
{
  "heatmapData": [
    {
      "topic": "Newton's Laws",
      "avgScore": 85,
      "attempts": 10,
      "level": "strong"
    }
  ]
}
```

---

### GET /analytics/pdf-insights

Get PDF engagement statistics.

**Response (200):**
```json
{
  "pdfStats": [
    {
      "pdfId": "pdf123",
      "pdfName": "Physics XI",
      "totalReads": 15,
      "timeSpent": "2h 30m",
      "avgScore": 82,
      "accuracy": 82,
      "lastAccessed": "2025-10-09T08:00:00Z"
    }
  ],
  "aiSummary": "You're most engaged with Physics XI Part 1..."
}
```

---

### GET /analytics/time-spent

Get daily study time (last 7 days).

**Response (200):**
```json
{
  "dailyData": [
    { "date": "Oct 3", "minutes": 45 },
    { "date": "Oct 4", "minutes": 30 }
  ]
}
```

---

### GET /analytics/recommendations

Get AI study recommendations.

**Response (200):**
```json
{
  "recommendations": [
    {
      "id": 1,
      "type": "quiz",
      "title": "Practice Weak Topics",
      "description": "Focus on challenging areas",
      "action": "Start Quiz",
      "icon": "🧩"
    }
  ],
  "weakTopics": ["Thermodynamics"],
  "weakTopicsData": [
    { "topic": "Thermodynamics", "avgScore": 52 }
  ]
}
```

---

## 📝 Notes Endpoints

### GET /notes

List notes for user (optionally filtered by PDF).

**Request:**
```http
GET /api/notes?pdfId=pdf123
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "items": [
    {
      "_id": "note123",
      "user": "user123",
      "pdfId": "pdf123",
      "type": "text",
      "content": "Important formula: F = ma",
      "page": 42,
      "createdAt": "2025-10-09T10:00:00Z"
    }
  ]
}
```

---

### POST /notes

Create new note.

**Request:**
```http
POST /api/notes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "text",
  "content": "Important formula: F = ma",
  "page": 42,
  "pdfId": "pdf123"
}
```

**Response (201):**
```json
{
  "_id": "note123",
  "user": "user123",
  "type": "text",
  "content": "Important formula: F = ma",
  "page": 42,
  "pdfId": "pdf123",
  "createdAt": "2025-10-09T10:00:00Z"
}
```

---

### PUT /notes/:id

Update existing note.

**Request:**
```http
PUT /api/notes/note123
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Updated formula: F = ma (Newton's 2nd Law)"
}
```

**Response (200):**
```json
{
  "_id": "note123",
  "content": "Updated formula: F = ma (Newton's 2nd Law)",
  "updatedAt": "2025-10-09T11:00:00Z"
}
```

---

### DELETE /notes/:id

Delete note.

**Request:**
```http
DELETE /api/notes/note123
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Note deleted"
}
```

---

## 🤖 AI Study Buddy Endpoints

### GET /aibuddy/sessions

List chat sessions.

**Request:**
```http
GET /api/aibuddy/sessions?type=general
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `type` (optional) - Filter by "pdf" or "general"

**Response (200):**
```json
{
  "sessions": [
    {
      "_id": "session123",
      "title": "Physics Study Session",
      "type": "general",
      "lastMessageAt": "2025-10-09T10:00:00Z",
      "messageCount": 15
    }
  ]
}
```

---

### POST /aibuddy/sessions

Create new chat session.

**Request:**
```http
POST /api/aibuddy/sessions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "general",
  "title": "New Study Session"
}
```

**Response (201):**
```json
{
  "session": {
    "_id": "session123",
    "user": "user123",
    "title": "New Study Session",
    "type": "general",
    "isActive": true,
    "createdAt": "2025-10-09T10:00:00Z"
  }
}
```

---

### GET /aibuddy/sessions/:sessionId/messages

Get messages in session.

**Request:**
```http
GET /api/aibuddy/sessions/session123/messages?limit=50
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "sessionId": "session123",
      "role": "user",
      "content": "Explain Newton's Laws",
      "createdAt": "2025-10-09T10:00:00Z"
    }
  ]
}
```

---

### POST /aibuddy/sessions/:sessionId/messages

Send message in session (AI Study Buddy responds).

**Request:**
```http
POST /api/aibuddy/sessions/session123/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Explain Newton's Laws",
  "useRAG": true
}
```

**Response (200):**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "role": "user",
      "content": "Explain Newton's Laws",
      "createdAt": "2025-10-09T10:00:00Z"
    },
    {
      "_id": "msg124",
      "role": "ai",
      "content": "Newton's Laws are three fundamental principles...",
      "meta": {
        "ragUsed": true,
        "sources": [
          { "type": "pdf", "id": "pdf123", "relevance": 0.89 }
        ]
      },
      "createdAt": "2025-10-09T10:00:05Z"
    }
  ]
}
```

---

## 🔗 WebSocket Events

### Connect

```javascript
// Development: use http://localhost:4000
// Production / Deployed:
const socket = io('https://beyondchats-cbtm.onrender.com', {
  auth: { token: 'Bearer <access_token>' }
});
```

### join-pdf
```javascript
socket.emit('join-pdf', { pdfId: 'pdf123' });
```

### chat-message
```javascript
socket.emit('chat-message', {
  content: 'What are the key points?',
  pdfId: 'pdf123'
});
```

### Events Received

- `message-saved` - User message stored
- `ai-typing` - AI is processing
- `ai-response-chunk` - Streaming chunk
- `ai-response-complete` - Full response
- `chat-error` - Error occurred

---

## 📄 Error Response Format

All errors follow consistent format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

**Last Updated:** October 2025  
**Version:** 1.0.0
