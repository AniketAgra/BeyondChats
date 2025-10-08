# Reattempt Tag Implementation

## Overview
This document describes the implementation of the reattempt tagging feature for quizzes. When a quiz is reattempted, it now stores a tag in the database and displays it in the quiz history.

## Changes Made

### 1. Database Schema Changes

#### `Backend/src/schemas/QuizAttempt.js`
Added two new fields to track reattempts:
- `isReattempt`: Boolean flag to indicate if this is a reattempt (default: false)
- `originalAttemptId`: Reference to the original attempt ID if this is a reattempt

```javascript
isReattempt: { type: Boolean, default: false },
originalAttemptId: { type: Types.ObjectId, ref: 'QuizAttempt', index: true },
```

### 2. Backend API Changes

#### `Backend/src/routes/quiz.js`
Updated the `/submit` endpoint to accept and store reattempt information:
- Accepts `isReattempt` and `originalAttemptId` from the request body
- Stores these fields in the QuizAttempt document

```javascript
const { questions, responses, topic, difficulty, pdfId, quizId, isReattempt, originalAttemptId } = req.body || {}
// ...
attemptData.isReattempt = isReattempt || false;
attemptData.originalAttemptId = originalAttemptId || null;
```

### 3. Frontend Changes

#### `Frontend/src/pages/QuizzesHistoryPage.jsx`
**Navigation Update:**
- Updated `confirmReattempt` to include `originalAttemptId` in the URL when navigating to quiz page
- Passes the original attempt ID for both reused quizzes and new quiz generation
- **Ensures PDF ID is included in URL for all reattempt scenarios** to maintain PDF reference

**UI Update:**
- Added display of reattempt tag in the attempt card
- Shows "🔄 Reattempt" badge for attempts marked as reattempts
- Tag appears before the PDF tag in the title section

```jsx
{attempt.isReattempt && (
  <span className={styles.reattemptTag}>
    🔄 Reattempt
  </span>
)}
```

#### `Frontend/src/pages/QuizPage.jsx`
- Extracts `originalAttemptId` from URL search params
- Passes `originalAttemptId` to QuizPlayer component

#### `Frontend/src/components/Quiz/QuizPlayer.jsx`
- Accepts `originalAttemptId` as a prop
- Includes `isReattempt` flag and `originalAttemptId` when submitting quiz results
- **Uses pdfId prop with fallback to quiz.pdfId** to ensure PDF reference is always included

```javascript
pdfId: pdfId || quiz.pdfId, // Use pdfId prop or fallback to quiz.pdfId
isReattempt: !!originalAttemptId,
originalAttemptId: originalAttemptId || null
```

#### `Frontend/src/components/Quiz/QuizGenerator.jsx`
- Updated `loadExistingQuizAndStart` to include PDF ID in quiz data
- **Extracts PDF reference from loaded quiz** or uses pdfId from URL
- Ensures reattempted quizzes maintain PDF association

```javascript
pdfId: quiz.pdf?._id || pdfId, // Include PDF reference from quiz or URL
```

### 4. Styling Changes

#### `Frontend/src/pages/QuizzesHistoryPage.module.css`
Added new CSS class for reattempt tag:
```css
.reattemptTag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  border: 1px solid rgba(245, 158, 11, 0.2);
}
```

## Data Flow

1. **User clicks "Reattempt" button** on a quiz attempt in history
2. **ReattemptModal confirms** the action
3. **Navigation** occurs with `originalAttemptId` and `pdfId` in URL parameters:
   - For saved quizzes: `/quiz?reuseQuizId={quizId}&originalAttemptId={attemptId}&pdfId={pdfId}`
   - For new generation: `/quiz?pdfId={pdfId}&originalAttemptId={attemptId}`
4. **QuizPage** extracts the `originalAttemptId` and `pdfId`, passes them to QuizPlayer
5. **QuizGenerator** (for reused quizzes) loads quiz and includes PDF reference in quiz data
6. **QuizPlayer** submits the quiz with:
   - `isReattempt: true`
   - `originalAttemptId: {attemptId}`
   - `pdfId: {pdfId}` - **Ensures PDF reference is preserved**
   - Same topic, difficulty as original
7. **Backend** stores the attempt with reattempt flags **and PDF reference**
8. **History page** displays the reattempt tag on subsequent loads

## Benefits

- **Clear tracking**: Easy to identify which attempts are reattempts
- **Data relationships**: Original attempt is linked for future analytics
- **User visibility**: Users can see at a glance which quizzes they've retaken
- **Consistency**: Topic, difficulty, and PDF references maintained from original attempt
- **Analytics ready**: Can track improvement over multiple attempts of same quiz

## Future Enhancements

Possible improvements:
- Show comparison between original and reattempt scores
- Display "Previous score: X%" on reattempt badge
- Filter view to show only reattempts or only original attempts
- Track number of reattempts for same quiz
- Show improvement percentage on reattempts
