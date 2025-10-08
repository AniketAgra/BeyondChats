# Quiz Reattempt Feature Implementation

## Overview
Implemented a separate Quiz model to store quiz questions permanently, allowing users to reattempt quizzes with the exact same questions. This provides consistency in learning assessment and enables meaningful progress tracking.

## Architecture Changes

### Backend Changes

#### 1. New Schema: `Quiz.js`
**Location**: `Backend/src/schemas/Quiz.js`

Created a new MongoDB schema to store quiz templates:

```javascript
{
  pdf: ObjectId (ref: 'Pdf', required),
  topic: String,
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  types: [String] (e.g., ['MCQ', 'SAQ']),
  questions: Array (full question data),
  totalQuestions: Number,
  createdBy: ObjectId (ref: 'User'),
  isActive: Boolean (default: true)
}
```

**Indexes**:
- `{ pdf: 1, difficulty: 1 }` - Find quizzes by PDF and difficulty
- `{ createdBy: 1, createdAt: -1 }` - User's quiz history
- `{ pdf: 1, isActive: 1 }` - Active quizzes per PDF

#### 2. Updated Schema: `QuizAttempt.js`
**Location**: `Backend/src/schemas/QuizAttempt.js`

Added reference to Quiz model:
- Added `quiz: ObjectId (ref: 'Quiz', required)` field
- Added index `{ user: 1, quiz: 1 }` for efficient lookups
- Maintains backward compatibility with existing `questions`, `responses`, and `results` arrays

#### 3. Enhanced Routes: `quiz.js`
**Location**: `Backend/src/routes/quiz.js`

**Modified Endpoints**:

##### POST `/api/quiz/generate`
- Added `reuseQuizId` parameter support
- If `reuseQuizId` provided, returns existing quiz questions
- Otherwise, generates new quiz and saves to Quiz collection
- Returns `quizId` in response for tracking

##### POST `/api/quiz/submit`
- Added `quizId` parameter to link attempts to quiz templates
- Stores attempt with quiz reference for reattempt capability

##### GET `/api/quiz/attempts`
- Now populates `quiz` field to include full quiz data
- Enables frontend to access quiz ID for reattempts

**New Endpoints**:

##### GET `/api/quiz/quiz/:id`
- Retrieves a specific quiz by ID
- Used for loading quiz questions when reattempting
- Returns full quiz data including questions array

##### GET `/api/quiz/quizzes`
- Lists all quizzes (optionally filtered by `pdfId`)
- Returns quiz metadata without full question details
- Useful for quiz library/history features

### Frontend Changes

#### 1. Updated API Client: `api.js`
**Location**: `Frontend/src/utils/api.js`

Added new methods to `quizApi`:
```javascript
getQuiz: async (id) => // Get specific quiz by ID
getQuizzes: async (pdfId) => // List all quizzes for a PDF
```

#### 2. Enhanced Component: `QuizGenerator.jsx`
**Location**: `Frontend/src/components/Quiz/QuizGenerator.jsx`

**New Props**:
- `reuseQuizId` - Quiz ID to reattempt

**New Functions**:
- `loadExistingQuiz(quizId)` - Loads and previews existing quiz questions
- Automatically triggers when `reuseQuizId` is provided

**UI Enhancements**:
- Shows "Quiz Ready for Reattempt" banner when loading existing quiz
- Displays reattempt indicator in preview section
- Pre-fills form fields based on loaded quiz

#### 3. Updated Component: `QuizPlayer.jsx`
**Location**: `Frontend/src/components/Quiz/QuizPlayer.jsx`

**Changes**:
- Includes `quizId` in submission payload
- Links each attempt to its parent quiz for future reattempts

#### 4. Enhanced Page: `QuizzesHistoryPage.jsx`
**Location**: `Frontend/src/pages/QuizzesHistoryPage.jsx`

**Modified Functions**:
- `handleReattempt(attempt)` - Smart reattempt logic:
  1. If `attempt.quiz._id` exists, reattempt with same questions
  2. Otherwise, generate new quiz for the same PDF
  3. Fallback to general quiz page

#### 5. Updated Page: `QuizPage.jsx`
**Location**: `Frontend/src/pages/QuizPage.jsx`

**New URL Parameters**:
- `reuseQuizId` - Triggers reattempt flow
- Passes parameter to QuizGenerator component

#### 6. New Styling: `Quiz.module.css`
**Location**: `Frontend/src/components/Quiz/Quiz.module.css`

**Added Classes**:
- `.reattemptBanner` - Purple gradient banner indicating reattempt mode

## User Flow

### First Quiz Attempt
1. User generates quiz from PDF or topic
2. Backend creates Quiz document with questions
3. Backend returns questions + `quizId`
4. User completes quiz
5. Submission creates QuizAttempt linked to Quiz

### Reattempt Flow
1. User clicks "🔄 Reattempt" on quiz history card
2. Navigates to `/quiz?reuseQuizId={quiz._id}`
3. QuizGenerator automatically loads existing quiz
4. Shows reattempt banner: "🔄 You're reattempting this quiz with the same questions"
5. User completes quiz with identical questions
6. New attempt is created, linked to same Quiz document

## Benefits

### For Users
- **Consistent Assessment**: Same questions ensure fair comparison across attempts
- **Progress Tracking**: See improvement on identical content over time
- **Learning Reinforcement**: Practice with known question set until mastery

### For System
- **Data Integrity**: Clean relationship between quizzes and attempts
- **Analytics**: Compare performance across multiple attempts of same quiz
- **Storage Efficiency**: Quiz questions stored once, referenced many times

## Database Relationships

```
User ──┬─> Quiz (many quizzes created by user)
       └─> QuizAttempt (many attempts by user)

PDF ───> Quiz (many quizzes per PDF)

Quiz ──> QuizAttempt (many attempts per quiz)

QuizAttempt ──┬─> User (belongs to user)
              ├─> Quiz (references quiz template)
              └─> PDF (optional, for context)
```

## API Examples

### Generate New Quiz
```javascript
POST /api/quiz/generate
{
  "pdfId": "abc123",
  "difficulty": "medium",
  "types": ["MCQ"],
  "count": 10
}

Response:
{
  "quizId": "quiz_xyz",
  "difficulty": "medium",
  "types": ["MCQ"],
  "questions": [...]
}
```

### Reattempt Existing Quiz
```javascript
POST /api/quiz/generate
{
  "reuseQuizId": "quiz_xyz"
}

Response:
{
  "quizId": "quiz_xyz",
  "difficulty": "medium",
  "questions": [...], // Same questions as before
  "isReattempt": true
}
```

### Submit Attempt
```javascript
POST /api/quiz/submit
{
  "quizId": "quiz_xyz",
  "questions": [...],
  "responses": [...],
  "pdfId": "abc123"
}

Response:
{
  "score": 80,
  "correct": 8,
  "total": 10,
  "attemptId": "attempt_123"
}
```

## Future Enhancements

### Potential Features
1. **Quiz Library**: Browse all saved quizzes by topic/difficulty
2. **Public Quizzes**: Share quiz templates with other users
3. **Quiz Analytics**: Detailed statistics per quiz (avg score, attempt count)
4. **Question Bank**: Reuse individual questions across quizzes
5. **Adaptive Difficulty**: Adjust difficulty based on performance
6. **Scheduled Quizzes**: Spaced repetition reminders for reattempts

### Performance Optimizations
1. **Caching**: Cache frequently reattempted quizzes
2. **Pagination**: For users with many quiz attempts
3. **Lazy Loading**: Load question details on-demand
4. **Indexing**: Add compound indexes for common query patterns

## Testing Checklist

- [x] Generate new quiz saves to Quiz collection
- [x] Quiz generation returns quizId
- [x] Reattempt loads exact same questions
- [x] Multiple attempts link to same Quiz
- [x] UI shows reattempt indicator
- [x] Quiz history displays quiz references
- [x] API endpoints handle missing quizId gracefully
- [ ] Test with deleted/inactive quizzes
- [ ] Test with missing PDF references
- [ ] Load testing with many attempts per quiz

## Migration Notes

### Existing Data
- Old QuizAttempts without `quiz` reference will continue to work
- Reattempt feature only available for new quizzes
- Consider backfilling quiz references for popular PDFs

### Backward Compatibility
- All existing APIs maintain their original behavior
- New `quizId` field is optional in most contexts
- Frontend gracefully handles missing quiz references

## Files Modified

### Backend
- ✅ `Backend/src/schemas/Quiz.js` (NEW)
- ✅ `Backend/src/schemas/QuizAttempt.js` (MODIFIED)
- ✅ `Backend/src/routes/quiz.js` (MODIFIED)

### Frontend
- ✅ `Frontend/src/utils/api.js` (MODIFIED)
- ✅ `Frontend/src/components/Quiz/QuizGenerator.jsx` (MODIFIED)
- ✅ `Frontend/src/components/Quiz/QuizPlayer.jsx` (MODIFIED)
- ✅ `Frontend/src/components/Quiz/Quiz.module.css` (MODIFIED)
- ✅ `Frontend/src/pages/QuizPage.jsx` (MODIFIED)
- ✅ `Frontend/src/pages/QuizzesHistoryPage.jsx` (MODIFIED)

## Deployment Steps

1. **Database Migration**: No schema changes needed (MongoDB is schema-less)
2. **Backend Deployment**: Deploy backend with new routes and schemas
3. **Frontend Deployment**: Deploy updated frontend
4. **Testing**: Verify reattempt flow works end-to-end
5. **Monitoring**: Watch for errors in quiz generation and submission

---

**Implementation Date**: January 2025
**Status**: ✅ Complete
**Version**: 1.0.0
