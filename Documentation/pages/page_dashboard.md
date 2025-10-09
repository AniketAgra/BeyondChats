# 📊 Dashboard Page Documentation

## Overview

The Dashboard page is the central analytics hub of EduLearn, providing students with comprehensive insights into their learning progress, performance trends, and personalized study recommendations.

**Route:** `/dashboard`  
**File:** `Frontend/src/pages/DashboardPage.jsx`  
**Authentication:** Required

---

## 🎯 Purpose

The Dashboard serves as:
- **Progress Tracker** - Visualize learning journey over time
- **Performance Analyzer** - Identify strengths and weaknesses
- **Study Motivator** - Gamification through badges and streaks
- **Recommendation Engine** - AI-driven study suggestions

---

## 📐 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar                                                     │
├─────────────────────────────────────────────────────────────┤
│  📊 Dashboard [with gradient title]                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┬─────────┬─────────────┐  │
│  │ 🕓 Study│ 📚 Top  │ 📊 Avg  │ 🔥 Streak│ 🏆 Level   │  │
│  │  Hours  │ Courseb.│ Score   │          │             │  │
│  ├─────────┴─────────┴─────────┴─────────┴─────────────┤  │
│  │ 🧩 Top Topics          ⚡ Weak Topics                │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  📈 Learning Analytics                                     │
│  ┌──────────────────────┬────────────────────────────────┐ │
│  │ Performance Trend    │  Topic Mastery Heatmap         │ │
│  │ (Line Chart)         │  (Color-coded Grid)            │ │
│  ├──────────────────────┴────────────────────────────────┤ │
│  │ Time Spent - Last 7 Days (Bar Chart)                  │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  📖 PDF Insights                                           │
│  [Table/Cards: PDF Name, Reads, Time, Avg Score, Accuracy]│
├─────────────────────────────────────────────────────────────┤
│  🎯 Recommendations & Actions                              │
│  [Action Cards: Practice Topics, Revise PDFs, etc.]       │
├─────────────────────────────────────────────────────────────┤
│  📋 Recent Activity                                        │
│  [Last 10 Quiz Attempts with details]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components Used

### 1. OverviewCards
**File:** `Frontend/src/components/Dashboard/OverviewCards.jsx`

**Purpose:** Display 7 quick-glance metrics in card format

**Cards:**
- **Total Study Hours** - Sum of all quiz durations
- **Top Coursebook** - Most studied PDF by attempt count
- **Average Score** - Overall quiz performance %
- **Current Streak** - Consecutive days with quiz activity
- **Learning Level** - Badge system based on total attempts
- **Top Topics** - 3 best-performing topics by accuracy
- **Weak Topics** - 3 lowest-performing topics needing practice

**Styling:**
- Gradient backgrounds for visual appeal
- Icon-based design for quick recognition
- Hover animations for interactivity
- Responsive grid layout (4 cols → 2 cols → 1 col)

**Data Source:** `GET /api/analytics/overview`

---

### 2. LearningAnalytics
**File:** `Frontend/src/components/Dashboard/LearningAnalytics.jsx`

**Purpose:** Visualize performance and study patterns

**Sub-Components:**

#### A. Performance Trend Chart
- **Type:** Line chart (Recharts)
- **X-Axis:** Quiz date/number
- **Y-Axis:** Score percentage (0-100%)
- **Data:** Last 10 quiz attempts
- **Features:**
  - Tooltip showing full details
  - Color gradient based on score
  - Responsive width

#### B. Topic Mastery Heatmap
- **Type:** Custom grid component
- **Data:** All topics with attempts
- **Color Coding:**
  - 🟢 Green: Strong (80%+ accuracy)
  - 🟡 Yellow: Moderate (60-79% accuracy)
  - 🔴 Red: Weak (<60% accuracy)
- **Tooltip:** Shows attempts and exact percentage
- **Layout:** Flexbox grid, wraps on smaller screens

#### C. Time Spent Bar Chart
- **Type:** Bar chart (Recharts)
- **X-Axis:** Last 7 days (date labels)
- **Y-Axis:** Minutes spent studying
- **Data:** Aggregated from quiz durations
- **Features:**
  - Today highlighted differently
  - Empty state for days without activity

**Data Sources:**
- `GET /api/analytics/overview` (performance trend)
- `GET /api/analytics/topic-mastery` (heatmap)
- `GET /api/analytics/time-spent` (bar chart)

---

### 3. PDFInsights
**File:** `Frontend/src/components/Dashboard/PDFInsights.jsx`

**Purpose:** Show engagement metrics per PDF

**Table Columns (Desktop):**
| PDF Name | Total Reads | Time Spent | Avg Score | Accuracy | Last Accessed |
|----------|-------------|------------|-----------|----------|---------------|
| Physics XI | 15 | 2h 30m | 82% | ████████░░ | 2 hrs ago |

**Card View (Mobile):**
Each PDF as card with:
- Title
- Stats in grid format
- Progress bar for accuracy
- Timestamp

**AI Summary:**
Dynamic text generated from data:
> "You're most engaged with Physics XI Part 1, average score 82%, showing steady improvement."

**Data Source:** `GET /api/analytics/pdf-insights`

---

### 4. Recommendations
**File:** `Frontend/src/components/Dashboard/Recommendations.jsx`

**Purpose:** Provide actionable study suggestions

**Recommendation Cards:**
1. **Practice Weak Topics**
   - Icon: 🧩
   - Action: Navigate to quiz with weak topics pre-selected
   - Shown if weak topics exist

2. **Revise from Top PDFs**
   - Icon: 📘
   - Action: Open library page
   - Always shown

3. **Generate Custom Quiz**
   - Icon: ⚡
   - Action: Create quiz from weak areas
   - Shown if weak topics exist

4. **Watch Suggested Videos**
   - Icon: 🎥
   - Action: Browse YouTube recommendations
   - Always shown

**Weak Topics Alert:**
If topics with <60% accuracy exist:
```
⚠️ Weak Topics Detected
Focus on: [Thermodynamics] [Quantum Mechanics] [Optics]
```

**Data Source:** `GET /api/analytics/recommendations`

---

### 5. RecentActivity
**File:** `Frontend/src/components/Dashboard/RecentActivity.jsx`

**Purpose:** Show last 10 quiz attempts

**Table/Card View:**
- Date & Time
- Topic name
- Question types (MCQ/SAQ/LAQ)
- Score (e.g., "8/10")
- Accuracy with color-coded progress bar:
  - Green: 80%+
  - Yellow: 60-79%
  - Red: <60%
- Time taken

**Footer:**
"View All Attempts" button → Links to `/quizzes`

**Data Source:** `GET /api/analytics/overview` (included in overview response)

---

## 🔄 Data Flow

### Initial Load

```javascript
useEffect(() => {
  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [overview, topicMastery, pdfInsights, timeSpent, recommendations] = 
        await Promise.all([
          analyticsApi.overview(),
          analyticsApi.topicMastery(),
          analyticsApi.pdfInsights(),
          analyticsApi.timeSpent(),
          analyticsApi.recommendations()
        ]);
      
      // Update state
      setOverviewData(overview);
      setTopicData(topicMastery);
      setPdfData(pdfInsights);
      setTimeData(timeSpent);
      setRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }
  
  fetchDashboardData();
}, []);
```

---

## 📡 API Endpoints Used

### 1. GET /api/analytics/overview

**Response:**
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
      "color": "#8b5cf6",
      "nextLevel": "Expert",
      "progress": 65
    }
  },
  "topPdf": {
    "id": "abc123",
    "title": "Physics Class XI",
    "attempts": 15,
    "avgScore": "82.0"
  },
  "topTopics": [
    { "topic": "Newton's Laws", "avgScore": "88.5", "attempts": 12 },
    { "topic": "Kinematics", "avgScore": "85.0", "attempts": 10 }
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
      "timeTaken": "7m 30s",
      "attemptId": "attempt123"
    }
  ]
}
```

### 2. GET /api/analytics/topic-mastery

**Response:**
```json
{
  "heatmapData": [
    {
      "topic": "Newton's Laws",
      "avgScore": 85,
      "attempts": 10,
      "level": "strong"
    },
    {
      "topic": "Thermodynamics",
      "avgScore": 55,
      "attempts": 5,
      "level": "weak"
    }
  ]
}
```

### 3. GET /api/analytics/pdf-insights

**Response:**
```json
{
  "pdfStats": [
    {
      "pdfId": "abc123",
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

### 4. GET /api/analytics/time-spent

**Response:**
```json
{
  "dailyData": [
    { "date": "Oct 3", "minutes": 45 },
    { "date": "Oct 4", "minutes": 30 },
    { "date": "Oct 5", "minutes": 0 },
    { "date": "Oct 6", "minutes": 60 }
  ]
}
```

### 5. GET /api/analytics/recommendations

**Response:**
```json
{
  "recommendations": [
    {
      "id": 1,
      "type": "quiz",
      "title": "Practice Weak Topics",
      "description": "Focus on your challenging areas",
      "action": "Start Quiz",
      "icon": "🧩"
    }
  ],
  "weakTopics": ["Thermodynamics", "Quantum Mechanics"],
  "weakTopicsData": [
    { "topic": "Thermodynamics", "avgScore": 52 }
  ]
}
```

---

## 🎨 Styling & Theme

**Color Scheme:**
- Primary: Indigo (#6366f1)
- Success/Strong: Green (#10b981)
- Warning/Moderate: Yellow (#f59e0b)
- Danger/Weak: Red (#ef4444)

**Card Styles:**
```css
.card {
  background: var(--card-background);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

**Responsive Breakpoints:**
- Desktop: >1024px
- Tablet: 768px - 1024px
- Mobile: <768px

---

## 🧠 Business Logic

### Learning Level Calculation

```javascript
function calculateLearningLevel(totalQuizzes) {
  if (totalQuizzes < 5) return { level: 'Explorer', icon: '🔍', color: '#3b82f6' };
  if (totalQuizzes < 15) return { level: 'Learner', icon: '📚', color: '#10b981' };
  if (totalQuizzes < 30) return { level: 'Scholar', icon: '🎓', color: '#8b5cf6' };
  if (totalQuizzes < 50) return { level: 'Expert', icon: '🏅', color: '#f59e0b' };
  return { level: 'Master', icon: '👑', color: '#ef4444' };
}
```

### Streak Calculation

```javascript
// Backend: src/routes/analytics.js
const attempts = await QuizAttempt.find({ user: userId })
  .sort({ createdAt: -1 })
  .lean();

let streak = 0;
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

for (const attempt of attempts) {
  const attemptDate = new Date(attempt.createdAt);
  attemptDate.setHours(0, 0, 0, 0);
  
  const diffDays = (currentDate - attemptDate) / (1000 * 60 * 60 * 24);
  
  if (diffDays === streak) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    break;
  }
}
```

### Topic Level Calculation

```javascript
function getTopicLevel(avgScore) {
  if (avgScore >= 80) return 'strong';
  if (avgScore >= 60) return 'moderate';
  return 'weak';
}
```

---

## 🚀 Performance Optimizations

1. **Parallel API Calls:** Use `Promise.all()` to fetch all data simultaneously
2. **Memoization:** Use `useMemo()` for expensive calculations
3. **Lazy Loading:** Components render progressively
4. **Chart Optimization:** Recharts uses virtualization for large datasets

---

## 🐛 Common Issues & Solutions

### Issue: Empty Dashboard
**Cause:** No quiz attempts yet  
**Solution:** Show empty state with "Take your first quiz!" CTA

### Issue: Incorrect Streak
**Cause:** Timezone differences  
**Solution:** Normalize dates to user's timezone (future enhancement)

### Issue: Slow Loading
**Cause:** Large dataset or slow API  
**Solution:** Implement skeleton loaders, pagination for recent activity

---

## 📚 Related Documentation

- [API Endpoints - Analytics](../api/api_endpoints.md#analytics)
- [Quiz Page](./page_quiz_engine.md)
- [Data Flow](../technical/data_flow.md)

---

**Developer Notes:**
- Dashboard refreshes on component mount only
- Consider implementing auto-refresh every 5 minutes
- Future: Add date range filter for analytics
- Future: Export dashboard as PDF report

---

**Last Updated:** October 2025  
**Version:** 1.0.0
