# Topic-Based Performance Tracking System

## Overview
Implemented a comprehensive topic-based learning analytics system that automatically identifies topics from PDFs, assigns topics to quiz questions, and tracks user performance across topics to identify weak and strong areas.

## Architecture

### 1. Database Schemas

#### Topic Schema (`Backend/src/schemas/Topic.js`)
- Stores AI-generated topics for each PDF
- Structure:
  - `mainTopic`: Main subject (e.g., "React JS", "Machine Learning")
  - `subtopics`: Array of subtopics (e.g., ["Hooks", "State Management"])
  - `status`: Generation status (pending/generating/completed/failed)
  - Indexed by user and PDF for efficient lookup

#### TopicPerformance Schema (`Backend/src/schemas/TopicPerformance.js`)
- Tracks user performance per topic per PDF
- Metrics:
  - Total questions, correct/incorrect answers
  - Accuracy percentage
  - Category: strong (≥80%), moderate (60-79%), weak (<60%)
  - Last attempt date
  - Associated question IDs
- Includes `updatePerformance()` method for easy updates

#### Updated Quiz Schema
- Added `topics` field to each question
- Allows AI to assign relevant topics when generating questions

### 2. AI Services

#### Topic Service (`Backend/src/services/topicService.js`)
Three main functions:

1. **`generateTopicsFromText(text, pdfTitle)`**
   - Analyzes PDF content to identify main topic and subtopics
   - Uses LLM to extract well-known terminology
   - Returns hierarchical structure: `{ mainTopic, subtopics }`

2. **`generateQuestionTopics(questionText, availableTopics)`**
   - Assigns 1-3 relevant topics to a single question
   - Filters from available topics for the PDF

3. **`generateQuestionsTopicsBatch(questions, availableTopics)`**
   - Batch processes multiple questions for efficiency
   - Returns array of topic arrays for each question

### 3. Backend Routes

#### Topics Route (`Backend/src/routes/topics.js`)
- `POST /api/topics/generate/:pdfId` - Generate topics for a PDF (async)
- `GET /api/topics/:pdfId` - Get topics for a PDF
- `GET /api/topics/performance/:pdfId` - Get weak/strong topics for a PDF
- `GET /api/topics/performance/dashboard/all` - Get overall topic performance

#### Updated Quiz Routes
- Modified `POST /api/quiz/generate` to assign topics to questions
- Modified `POST /api/quiz/submit` to track topic performance on each answer

#### Updated Analytics Routes
- Enhanced `GET /api/analytics/overview` to include topic insights
- Returns `topicInsights` with weak and strong topics

#### Updated PDF Routes
- Automatically triggers topic generation when PDF is uploaded
- Runs asynchronously alongside key features generation

### 4. Frontend Components

#### TopicInsights Component (`Frontend/src/components/Dashboard/TopicInsights.jsx`)
- Displays weak and strong topics on dashboard
- Shows:
  - Topic name and accuracy
  - Number of questions answered
  - Associated PDFs
  - Visual progress bars with color coding

#### PDFTopicPerformance Component (`Frontend/src/components/Dashboard/PDFTopicPerformance.jsx`)
- Shows topic performance for individual PDFs
- Three categories:
  - Needs Practice (weak topics)
  - Improving (moderate topics)
  - Mastered (strong topics)
- Falls back to showing available topics if no performance data

#### Updated DashboardPage
- Integrated TopicInsights component
- Shows overall topic performance across all PDFs

## How It Works

### PDF Upload Flow
1. User uploads PDF
2. System extracts text and generates:
   - Chapters
   - Summary
   - Key points
   - **Topics** (main topic + subtopics) ← NEW

### Quiz Generation Flow
1. User requests quiz for a PDF
2. System generates questions using LLM
3. For each question, AI assigns relevant topics from PDF's subtopics ← NEW
4. Quiz includes topic metadata with each question

### Quiz Submission Flow
1. User submits quiz answers
2. System calculates score for each question
3. For each question:
   - Gets associated topics
   - Updates TopicPerformance for each topic ← NEW
   - Tracks correct/incorrect per topic
   - Recalculates accuracy and category

### Dashboard Display
1. Dashboard loads analytics
2. Shows topic insights:
   - Overall weak topics (need practice)
   - Overall strong topics (mastered)
   - Topics aggregated across all PDFs
3. Users can identify specific areas needing improvement

## Benefits

### For Students
- **Clear visibility** of weak topics across all materials
- **Focused practice** on specific subtopics needing improvement
- **Progress tracking** as topics move from weak → moderate → strong
- **Motivation** from seeing mastered topics

### For Learning
- **Granular insights** beyond overall scores
- **Topic-specific** recommendations
- **Cross-PDF tracking** of related topics
- **Data-driven** study planning

## Example Use Case

**Scenario**: Student uploads "React JS Tutorial.pdf"

1. **Topic Generation**:
   - Main Topic: "React JS"
   - Subtopics: ["Components", "Hooks", "State Management", "Props", "JSX", "Lifecycle Methods"]

2. **Quiz Generation**:
   - Q1: "What is useState?" → Topics: ["Hooks", "State Management"]
   - Q2: "How do props work?" → Topics: ["Props", "Components"]
   - Q3: "What is JSX?" → Topics: ["JSX"]

3. **After Quiz Submission**:
   - User gets "Hooks" wrong → Hooks marked as weak
   - User gets "Props" correct → Props marked as strong
   - Dashboard shows: "Needs Practice: Hooks, State Management"

4. **Next Quiz**:
   - More questions on Hooks
   - User improves → Hooks moves to moderate
   - Visible progress motivates continued learning

## API Integration

### Getting Topics for a PDF
```javascript
GET /api/topics/:pdfId
Response: {
  status: 'completed',
  mainTopic: 'React JS',
  subtopics: ['Hooks', 'State Management', ...],
  createdAt: '...',
  updatedAt: '...'
}
```

### Getting Topic Performance
```javascript
GET /api/topics/performance/:pdfId
Response: {
  weakTopics: [
    { topic: 'Hooks', accuracy: 45, totalQuestions: 10, ... }
  ],
  strongTopics: [
    { topic: 'Props', accuracy: 90, totalQuestions: 8, ... }
  ],
  moderateTopics: [...],
  allPerformances: [...]
}
```

### Dashboard Topic Insights
```javascript
GET /api/analytics/overview
Response: {
  ...otherData,
  topicInsights: {
    overallWeakTopics: [...],
    overallStrongTopics: [...]
  }
}
```

## Configuration

### Environment Variables
Uses existing LLM configuration:
- `LLM_PROVIDER` (gemini/openai)
- `GEMINI_API_KEY` or `OPENAI_API_KEY`
- Same AI provider used for quiz, summary, and topic generation

### Customization
- Accuracy thresholds can be adjusted in `TopicPerformance` schema
- Topic count (3-15 subtopics) can be modified in prompts
- UI styling in CSS modules can be customized per theme

## Future Enhancements

Potential improvements:
1. **Topic recommendations**: Suggest specific topics to practice
2. **Topic-based quiz generation**: Generate quizzes focusing on weak topics
3. **Topic difficulty levels**: Track performance per difficulty per topic
4. **Topic learning paths**: Suggest prerequisite topics
5. **Spaced repetition**: Recommend revisiting weak topics
6. **Topic clustering**: Group related topics across PDFs
7. **Export reports**: Generate topic performance PDFs
8. **Collaborative learning**: Compare topic performance with peers

## Files Modified/Created

### Backend
- ✅ Created: `src/schemas/Topic.js`
- ✅ Created: `src/schemas/TopicPerformance.js`
- ✅ Created: `src/services/topicService.js`
- ✅ Created: `src/routes/topics.js`
- ✅ Modified: `src/schemas/Quiz.js`
- ✅ Modified: `src/services/quizService.js`
- ✅ Modified: `src/routes/quiz.js`
- ✅ Modified: `src/routes/analytics.js`
- ✅ Modified: `src/routes/pdfRoutes.js`
- ✅ Modified: `src/app.js`

### Frontend
- ✅ Created: `src/components/Dashboard/TopicInsights.jsx`
- ✅ Created: `src/components/Dashboard/TopicInsights.module.css`
- ✅ Created: `src/components/Dashboard/PDFTopicPerformance.jsx`
- ✅ Created: `src/components/Dashboard/PDFTopicPerformance.module.css`
- ✅ Modified: `src/pages/DashboardPage.jsx`

## Testing Checklist

- [ ] Upload a PDF and verify topics are generated
- [ ] Generate quiz and verify questions have topics
- [ ] Submit quiz and verify topic performance is tracked
- [ ] Check dashboard shows weak/strong topics
- [ ] Verify topic performance updates after multiple quizzes
- [ ] Test topic performance on individual PDF pages
- [ ] Verify categories update correctly (weak/moderate/strong)
- [ ] Test with multiple PDFs and cross-PDF topic aggregation

## Conclusion

This system provides intelligent, automated topic tracking that helps students identify exactly where they need improvement. By leveraging AI to extract topics and assign them to questions, it creates a granular, actionable view of learning progress that goes far beyond simple quiz scores.
