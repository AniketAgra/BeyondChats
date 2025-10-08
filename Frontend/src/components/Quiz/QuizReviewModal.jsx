import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './QuizReviewModal.module.css'
import { quizApi } from '../../utils/api.js'

export default function QuizReviewModal({ attemptId, onClose }) {
  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showExplanations, setShowExplanations] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (attemptId) {
      loadAttempt()
    }
  }, [attemptId])

  const loadAttempt = async () => {
    setLoading(true)
    try {
      const data = await quizApi.getAttempt(attemptId)
      setAttempt(data)
    } catch (error) {
      console.error('Failed to load attempt:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReattempt = () => {
    // If quiz reference exists, reattempt with same questions
    if (attempt?.quiz?._id) {
      navigate(`/quiz?reuseQuizId=${attempt.quiz._id}`)
    } else if (attempt?.pdf) {
      // Fallback to generating new quiz for the same PDF
      navigate(`/quiz?pdfId=${attempt.pdf._id}`)
    } else {
      // If no PDF is associated, cannot create quiz
      alert('Cannot reattempt: This quiz is not associated with a PDF.')
      return
    }
    onClose()
  }

  if (!attemptId) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading quiz details...</p>
          </div>
        ) : attempt ? (
          <>
            <div className={styles.modalHeader}>
              <div>
                <h2>📝 Quiz Review</h2>
                <div className={styles.quizInfo}>
                  <span className={styles.topic}>{attempt.topic || 'General Quiz'}</span>
                  {attempt.pdf && (
                    <span className={styles.pdfBadge}>
                      📄 {attempt.pdf.title || attempt.pdf.filename}
                    </span>
                  )}
                  <span className={styles.difficultyBadge}>
                    {attempt.difficulty === 'easy' && '🟢 Easy'}
                    {attempt.difficulty === 'medium' && '🟡 Medium'}
                    {attempt.difficulty === 'hard' && '🔴 Hard'}
                  </span>
                  <span className={styles.dateBadge}>
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
              <button className={styles.closeButton} onClick={onClose}>✕</button>
            </div>

            <div className={styles.scoreSection}>
              <div className={styles.mainScore}>
                <div className={styles.scoreValue}>{attempt.score}%</div>
                <div className={styles.scoreLabel}>Final Score</div>
              </div>
              <div className={styles.scoreBreakdown}>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreIcon}>✅</span>
                  <span className={styles.scoreText}>{attempt.correct} Correct</span>
                </div>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreIcon}>❌</span>
                  <span className={styles.scoreText}>{attempt.total - attempt.correct} Wrong</span>
                </div>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreIcon}>📊</span>
                  <span className={styles.scoreText}>{attempt.total} Total</span>
                </div>
              </div>
            </div>

            <div className={styles.actionsBar}>
              <button 
                className={styles.toggleButton}
                onClick={() => setShowExplanations(!showExplanations)}
              >
                {showExplanations ? '�️ Hide Explanations' : '�️ Show Explanations'}
              </button>
              <button className={styles.reattemptButton} onClick={handleReattempt}>
                🔄 Reattempt Quiz
              </button>
            </div>

            <div className={styles.questionsSection}>
              <h3>Detailed Results</h3>
              {attempt.results && attempt.results.map((result, idx) => {
                const question = attempt.questions[idx]
                const userResponse = attempt.responses[idx]
                
                return (
                  <div 
                    key={result.questionId || idx} 
                    className={`${styles.questionCard} ${result.isCorrect ? styles.correct : styles.incorrect}`}
                  >
                    <div className={styles.questionHeader}>
                      <span className={styles.questionNumber}>Question {idx + 1}</span>
                      <div className={styles.resultBadge}>
                        {result.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                        {question.type !== 'MCQ' && ` (${result.score}%)`}
                      </div>
                    </div>

                    <div className={styles.questionText}>
                      <strong>[{question.type}]</strong> {question.question}
                    </div>

                    {question.type === 'MCQ' && (
                      <>
                        <div className={styles.answerSection}>
                          <div className={styles.answerLabel}>Your Answer:</div>
                          <div className={`${styles.answerValue} ${!result.isCorrect ? styles.wrongAnswer : styles.correctAnswer}`}>
                            {userResponse !== null && userResponse !== undefined
                              ? question.options[userResponse] || 'Not answered'
                              : 'Not answered'}
                          </div>
                        </div>
                        {!result.isCorrect && (
                          <div className={styles.answerSection}>
                            <div className={styles.answerLabel}>Correct Answer:</div>
                            <div className={`${styles.answerValue} ${styles.correctAnswer}`}>
                              {question.options[result.correctAnswer]}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {question.type !== 'MCQ' && (
                      <>
                        <div className={styles.answerSection}>
                          <div className={styles.answerLabel}>Your Answer:</div>
                          <div className={styles.textAnswer}>
                            {userResponse || 'Not answered'}
                          </div>
                        </div>
                        <div className={styles.answerSection}>
                          <div className={styles.answerLabel}>Model Answer:</div>
                          <div className={styles.textAnswer}>
                            {result.correctAnswer}
                          </div>
                        </div>
                      </>
                    )}

                    {showExplanations && result.explanation && (
                      <div className={styles.explanation}>
                        <strong>💡 Explanation:</strong>
                        <p>{result.explanation}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className={styles.error}>
            <p>Failed to load quiz details.</p>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
