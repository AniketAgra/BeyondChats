# Quiz Generator Engine - Complete Documentation

## Overview
The Quiz Generator Engine is a comprehensive feature that allows users to generate intelligent quizzes from PDF documents using AI, with support for multiple question types, automated scoring, and detailed explanations.

## Key Features

### 1. **Multiple Question Types**
- **MCQ (Multiple Choice Questions)**: 4 options with single correct answer
- **SAQ (Short Answer Questions)**: Brief text-based answers (2-3 sentences)
- **LAQ (Long Answer Questions)**: Detailed paragraph answers (5-7 sentences)

### 2. **AI-Powered Question Generation**
- Leverages Gemini or OpenAI APIs to generate contextual questions
- Extracts key concepts from PDF content
- Creates relevant and meaningful questions based on difficulty level
- Provides comprehensive explanations for each answer

### 3. **Difficulty Levels**
- **Easy**: Straightforward, basic concepts
- **Medium**: Moderate complexity requiring understanding
- **Hard**: Advanced topics requiring deep analysis

### 4. **Intelligent Scoring System**
- **MCQ**: Binary scoring (correct/incorrect)
- **SAQ/LAQ**: Advanced text similarity scoring based on:
  - Keyword matching (40% weight)
  - Length appropriateness (20% weight)
  - Common word analysis (40% weight)
  - Minimum 60% threshold for "correct" classification

### 5. **Detailed Results & Explanations**
- Overall score percentage
- Question-by-question breakdown
- User's answer vs. correct answer comparison
- Detailed explanations for better understanding
- Toggle to show/hide explanations

### 6. **User-Friendly Interface**
- Progress tracking with visual progress bar
- Question navigation grid
- Answer status indicators
- Responsive design
- Beautiful UI with smooth animations

## Technical Architecture

### Backend Components

#### 1. **Quiz Service** (`Backend/src/services/quizService.js`)
- AI client integration (Gemini/OpenAI)
- Quiz generation logic
- Question parsing and formatting
- Text-based answer scoring
- Fallback dummy quiz generation

**Key Functions:**
```javascript
generateQuiz({ text, pdfId, difficulty, types, topic, count })
submitQuiz({ questions, responses })
```

#### 2. **Quiz Routes** (`Backend/src/routes/quiz.js`)
- `POST /api/quiz/generate`: Generate quiz from PDF or text
- `POST /api/quiz/submit`: Submit quiz and get scored results
- `GET /api/quiz/attempts`: Retrieve user's quiz history

#### 3. **Quiz Attempt Schema** (`Backend/src/schemas/QuizAttempt.js`)
Stores:
- User reference
- PDF reference (optional)
- Topic and difficulty
- Score, correct count, total questions
- Timestamps

### Frontend Components

#### 1. **QuizGenerator** (`Frontend/src/components/Quiz/QuizGenerator.jsx`)
Features:
- PDF selection dropdown
- Topic input (optional)
- Difficulty level selector
- Question type checkboxes (MCQ, SAQ, LAQ)
- Question count slider (1-20)
- Quiz preview with all questions
- Generate new quiz button

#### 2. **QuizPlayer** (`Frontend/src/components/Quiz/QuizPlayer.jsx`)
Features:
- Interactive question display
- Progress tracking
- Multiple input types (radio, textarea)
- Navigation between questions
- Answer grid for quick navigation
- Comprehensive results screen
- Detailed explanations view

#### 3. **Quiz Page** (`Frontend/src/pages/QuizPage.jsx`)
- Route: `/quiz?pdfId={id}` (optional pdfId parameter)
- Manages quiz state (generator vs player)
- Passes PDF context to components

## Usage Flow

### From PDF Page
1. User views a PDF document
2. Clicks "Generate Quiz" button in left sidebar
3. Navigates to Quiz page with PDF pre-selected
4. Configures quiz settings (difficulty, types, count)
5. Generates and previews quiz
6. Starts quiz when ready

### Standalone Quiz
1. User navigates to `/quiz` directly
2. Selects PDF from dropdown (optional)
3. Configures quiz settings
4. Generates and takes quiz

### Taking Quiz
1. User answers questions one by one
2. Progress tracked in real-time
3. Can navigate between questions freely
4. Submits when all questions answered
5. Views detailed results with explanations

## API Endpoints

### Generate Quiz
```http
POST /api/quiz/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "pdfId": "optional_pdf_id",
  "text": "optional_text_content",
  "difficulty": "easy|medium|hard",
  "types": ["MCQ", "SAQ", "LAQ"],
  "topic": "Optional topic focus",
  "count": 10
}

Response:
{
  "difficulty": "medium",
  "types": ["MCQ", "SAQ"],
  "topic": "Machine Learning",
  "questions": [
    {
      "id": "q1",
      "type": "MCQ",
      "question": "What is...",
      "options": ["A", "B", "C", "D"],
      "answerIndex": 0,
      "explanation": "..."
    },
    {
      "id": "q2",
      "type": "SAQ",
      "question": "Explain...",
      "answer": "Expected answer...",
      "keywords": ["key", "terms"],
      "explanation": "..."
    }
  ]
}
```

### Submit Quiz
```http
POST /api/quiz/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "questions": [...],
  "responses": [0, "User's text answer", ...],
  "topic": "Machine Learning",
  "difficulty": "medium",
  "pdfId": "optional_pdf_id"
}

Response:
{
  "score": 85,
  "correct": 8,
  "total": 10,
  "results": [
    {
      "questionId": "q1",
      "isCorrect": true,
      "score": 100,
      "userAnswer": 0,
      "correctAnswer": 0,
      "explanation": "..."
    }
  ]
}
```

### Get Quiz Attempts
```http
GET /api/quiz/attempts?pdfId={id}&limit=10
Authorization: Bearer {token}

Response:
{
  "attempts": [
    {
      "_id": "...",
      "user": "...",
      "pdf": { "title": "...", "filename": "..." },
      "topic": "Machine Learning",
      "difficulty": "medium",
      "score": 85,
      "correct": 8,
      "total": 10,
      "createdAt": "2025-10-07T..."
    }
  ]
}
```

## Configuration

### Environment Variables
```env
# Choose one AI provider
LLM_PROVIDER=gemini  # or 'openai'

# If using Gemini
GEMINI_API_KEY=your_api_key_here

# If using OpenAI
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini  # optional, defaults to gpt-4o-mini
```

## Scoring Algorithm

### MCQ Questions
- Binary: 1 point for correct, 0 for incorrect

### Text-Based Questions (SAQ/LAQ)
```javascript
score = (keywordScore * 0.4) + (lengthScore * 0.2) + (wordScore * 0.4)

keywordScore = matchedKeywords / totalKeywords
lengthScore = min(userLength / expectedLength, 1)
wordScore = commonWords / totalExpectedWords
```

Threshold: ≥60% = Correct, <60% = Incorrect

## UI/UX Features

### Visual Indicators
- ✅ Green for correct answers
- ❌ Red for incorrect answers
- 🎯 Icon for quiz generation
- 📝 Question type badges
- 📊 Progress bars and counters

### Responsive Design
- Works on desktop and tablet
- Flexible layouts
- Touch-friendly buttons
- Optimized for reading

### Accessibility
- Clear visual hierarchy
- Sufficient contrast
- Keyboard navigation support
- Status indicators

## Future Enhancements

### Potential Features
1. **Timed Quizzes**: Add countdown timer
2. **Question Bank**: Save and reuse questions
3. **Difficulty Analysis**: Show which difficulty user struggles with
4. **Topic Mastery**: Track performance by topic
5. **Spaced Repetition**: Suggest quiz retakes based on forgetting curve
6. **Collaborative Quizzes**: Share quizzes with others
7. **Export Results**: Download results as PDF
8. **Question Feedback**: Allow users to report bad questions
9. **Custom Questions**: Let users add their own questions
10. **Multimedia Questions**: Support images and videos

### Technical Improvements
1. **Caching**: Cache generated quizzes
2. **Background Generation**: Generate quizzes asynchronously
3. **Better AI Prompts**: Fine-tune prompts for better questions
4. **Advanced Scoring**: Use ML models for text similarity
5. **Question Validation**: Check question quality automatically

## Troubleshooting

### Common Issues

**1. Quiz generation fails**
- Check AI API keys are configured
- Verify LLM_PROVIDER is set correctly
- Ensure PDF has extractable text

**2. All scores are 0 for text answers**
- Check that keywords are being generated
- Verify response format is correct

**3. Questions seem irrelevant**
- Try specifying a more specific topic
- Ensure PDF content is clear and well-formatted
- Check that enough text is extracted from PDF

## Testing Recommendations

### Manual Testing Checklist
- [ ] Generate quiz without PDF
- [ ] Generate quiz with PDF
- [ ] Test all difficulty levels
- [ ] Test all question types (MCQ, SAQ, LAQ)
- [ ] Test mixed question types
- [ ] Answer all questions and submit
- [ ] Leave some questions blank and submit
- [ ] Navigate between questions
- [ ] View detailed results
- [ ] Toggle explanations
- [ ] Check quiz attempts history
- [ ] Test from PDF page navigation

### Edge Cases
- [ ] Very long PDF (>100 pages)
- [ ] PDF with no text (scanned images)
- [ ] Empty topic field
- [ ] 1 question quiz
- [ ] 20 questions quiz
- [ ] All question types selected
- [ ] Network failure during generation
- [ ] Network failure during submission

## Performance Considerations

### Backend
- AI API calls can take 5-30 seconds
- Consider implementing request timeouts
- Cache frequently used PDF extracts
- Implement rate limiting for quiz generation

### Frontend
- Large quizzes (20 questions) load smoothly
- Text comparison is client-side efficient
- Consider virtualizing for 50+ questions

## Security Considerations

- All routes require authentication
- Quiz attempts tied to user ID
- PDF access verified before quiz generation
- No sensitive data in quiz questions
- Rate limiting recommended for API calls

## Analytics Opportunities

### Metrics to Track
- Quiz generation count per user
- Average quiz scores by difficulty
- Most common question types selected
- Completion rate
- Time spent per quiz
- Question accuracy by type
- Topic popularity

---

**Version**: 1.0.0  
**Last Updated**: October 7, 2025  
**Maintainers**: BeyondChats Development Team
