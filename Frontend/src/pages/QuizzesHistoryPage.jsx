import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './QuizzesHistoryPage.module.css'
import { quizApi, analyticsApi } from '../utils/api.js'
import QuizReviewModal from '../components/Quiz/QuizReviewModal.jsx'
import ReattemptModal from '../components/Quiz/ReattemptModal.jsx'

export default function QuizzesHistoryPage() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [selectedAttemptId, setSelectedAttemptId] = useState(null)
  const [reattemptAttempt, setReattemptAttempt] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [attemptsData, analytics] = await Promise.all([
        quizApi.getAttempts(),
        analyticsApi.overview()
      ])
      setAttempts(attemptsData)
      setAnalyticsData(analytics)
    } catch (error) {
      console.error('Failed to load quiz data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (attemptId) => {
    setSelectedAttemptId(attemptId)
  }

  const handleReattemptClick = (attempt) => {
    setReattemptAttempt(attempt)
  }

  const confirmReattempt = () => {
    const attempt = reattemptAttempt
    setReattemptAttempt(null)
    
    // If quiz reference exists, reattempt with same questions
    if (attempt.quiz?._id) {
      // Include pdfId to ensure PDF reference is maintained
      const pdfParam = attempt.pdf?._id ? `&pdfId=${attempt.pdf._id}` : ''
      navigate(`/quiz?reuseQuizId=${attempt.quiz._id}&originalAttemptId=${attempt._id}${pdfParam}`)
    } else if (attempt.pdf) {
      // Fallback to generating new quiz for the same PDF
      navigate(`/quiz?pdfId=${attempt.pdf._id}&originalAttemptId=${attempt._id}`)
    } else {
      // If no PDF is associated, cannot create quiz
      alert('Cannot reattempt: This quiz is not associated with a PDF.')
    }
  }

  const cancelReattempt = () => {
    setReattemptAttempt(null)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return styles.excellent
    if (score >= 60) return styles.good
    if (score >= 40) return styles.average
    return styles.poor
  }

  const calculateAverageScore = () => {
    if (attempts.length === 0) return 0
    const total = attempts.reduce((sum, attempt) => sum + attempt.score, 0)
    return Math.round(total / attempts.length)
  }

  const getScoreTrend = () => {
    if (attempts.length < 2) return null
    const recent = attempts.slice(0, 5)
    const older = attempts.slice(5, 10)
    if (older.length === 0) return null
    
    const recentAvg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length
    const olderAvg = older.reduce((sum, a) => sum + a.score, 0) / older.length
    const diff = recentAvg - olderAvg
    
    if (diff > 5) return { direction: '↑', text: `+${Math.round(diff)}%`, positive: true }
    if (diff < -5) return { direction: '↓', text: `${Math.round(diff)}%`, positive: false }
    return { direction: '→', text: 'Stable', neutral: true }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your quiz history...</p>
        </div>
      </div>
    )
  }

  const avgScore = calculateAverageScore()
  const trend = getScoreTrend()
  const totalQuizzes = attempts.length
  const totalCorrect = attempts.reduce((sum, a) => sum + a.correct, 0)
  const totalQuestions = attempts.reduce((sum, a) => sum + a.total, 0)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>📚 Quiz History</h1>
          <p className={styles.subtitle}>Track your learning progress and performance</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Average Score</div>
            <div className={styles.statValue}>{avgScore}%</div>
            {trend && (
              <div className={`${styles.statTrend} ${trend.positive ? styles.positive : trend.negative ? styles.negative : styles.neutral}`}>
                {trend.direction} {trend.text}
              </div>
            )}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Quizzes</div>
            <div className={styles.statValue}>{totalQuizzes}</div>
            <div className={styles.statSubtext}>Completed</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Questions Answered</div>
            <div className={styles.statValue}>{totalCorrect}/{totalQuestions}</div>
            <div className={styles.statSubtext}>Correct answers</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Success Rate</div>
            <div className={styles.statValue}>
              {totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%
            </div>
            <div className={styles.statSubtext}>Overall accuracy</div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {analyticsData?.recent && analyticsData.recent.length > 0 && (
        <div className={styles.chartCard}>
          <h3>📊 Performance Trend (Last 7 Quizzes)</h3>
          <div className={styles.chartContainer}>
            <svg className={styles.chart} viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05"/>
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={200 - (y * 2)}
                  x2="600"
                  y2={200 - (y * 2)}
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}
              
              {/* Area under curve */}
              <path 
                d={`M 0,200 ${analyticsData.recent.map((item, i) => {
                  const x = (i / (analyticsData.recent.length - 1)) * 600
                  const y = 200 - (item.score * 2)
                  return `L ${x},${y}`
                }).join(' ')} L 600,200 Z`}
                fill="url(#chartGradient)"
              />
              
              {/* Line */}
              <path 
                d={analyticsData.recent.map((item, i) => {
                  const x = (i / (analyticsData.recent.length - 1)) * 600
                  const y = 200 - (item.score * 2)
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`
                }).join(' ')}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {analyticsData.recent.map((item, i) => {
                const x = (i / (analyticsData.recent.length - 1)) * 600
                const y = 200 - (item.score * 2)
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="var(--accent)"
                    stroke="var(--bg)"
                    strokeWidth="2"
                  />
                )
              })}
            </svg>
            
            <div className={styles.chartLabels}>
              {analyticsData.recent.map((item, i) => (
                <div key={i} className={styles.chartLabel}>
                  <div className={styles.chartLabelScore}>{item.score}%</div>
                  <div className={styles.chartLabelDate}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Attempts List */}
      <div className={styles.attemptsSection}>
        <h3>📋 Recent Attempts</h3>
        
        {attempts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3>No quizzes taken yet</h3>
            <p>Start your learning journey by generating your first quiz!</p>
            <button className="btn" onClick={handleGenerateQuiz}>
              ✨ Generate Your First Quiz
            </button>
          </div>
        ) : (
          <div className={styles.attemptsList}>
            {attempts.map((attempt) => (
              <div key={attempt._id} className={styles.attemptCard}>
                <div className={styles.attemptHeader}>
                  <div className={`${styles.scoreCircle} ${getScoreColor(attempt.score)}`}>
                    <div className={styles.scoreValue}>{attempt.score}%</div>
                    <div className={styles.scoreLabel}>Score</div>
                  </div>
                  
                  <div className={styles.attemptInfo}>
                    <div className={styles.attemptTitle}>
                      {attempt.topic || 'General Quiz'}
                      {attempt.isReattempt && (
                        <span className={styles.reattemptTag}>
                          🔄 Reattempt
                        </span>
                      )}
                      {attempt.pdf && (
                        <span className={styles.pdfTag}>
                          📄 {attempt.pdf.title || attempt.pdf.filename}
                        </span>
                      )}
                    </div>
                    <div className={styles.attemptMeta}>
                      <span className={styles.difficulty}>
                        {attempt.difficulty === 'easy' && '🟢 Easy'}
                        {attempt.difficulty === 'medium' && '🟡 Medium'}
                        {attempt.difficulty === 'hard' && '🔴 Hard'}
                      </span>
                      <span className={styles.date}>
                        {new Date(attempt.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.headerActions}>
                    <button 
                      className={styles.reviewButtonCompact}
                      onClick={() => handleReview(attempt._id)}
                    >
                      Review Answers
                    </button>
                    <button 
                      className={styles.reattemptButtonCompact}
                      onClick={() => handleReattemptClick(attempt)}
                    >
                      Reattempt
                    </button>
                  </div>
                </div>
                
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${(attempt.correct / attempt.total) * 100}%` }}
                  ></div>
                </div>

                <div className={styles.attemptStats}>
                  <div className={styles.attemptStat}>
                    <span className={styles.attemptStatLabel}>✅ Correct</span>
                    <span className={styles.attemptStatValue}>{attempt.correct}</span>
                  </div>
                  <div className={styles.attemptStat}>
                    <span className={styles.attemptStatLabel}>❌ Wrong</span>
                    <span className={styles.attemptStatValue}>{attempt.total - attempt.correct}</span>
                  </div>
                  <div className={styles.attemptStat}>
                    <span className={styles.attemptStatLabel}>📊 Total</span>
                    <span className={styles.attemptStatValue}>{attempt.total}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedAttemptId && (
        <QuizReviewModal
          attemptId={selectedAttemptId}
          onClose={() => setSelectedAttemptId(null)}
        />
      )}

      {/* Reattempt Confirmation Modal */}
      {reattemptAttempt && (
        <ReattemptModal
          attempt={reattemptAttempt}
          onConfirm={confirmReattempt}
          onCancel={cancelReattempt}
        />
      )}
    </div>
  )
}
