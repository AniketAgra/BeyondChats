import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, UNSAFE_NavigationContext } from 'react-router-dom'
import styles from './Quiz.module.css'
import { quizApi } from '../../utils/api.js'
import QuizModal from './QuizModal.jsx'

export default function QuizPlayer({ quiz, onExit, pdfId, originalAttemptId }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null))
  const [result, setResult] = useState(null)
  const [showExplanations, setShowExplanations] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, type: 'warning', title: '', message: '', onConfirm: null })
  const [allowNavigation, setAllowNavigation] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const navigationContext = React.useContext(UNSAFE_NavigationContext)
  const unblockRef = useRef(null)
  
  const q = quiz.questions[index]
  const progress = Math.round(((index + 1) / quiz.questions.length) * 100)

  // Block all navigation attempts (links, back button, etc.)
  useEffect(() => {
    if (!result && !allowNavigation && navigationContext?.navigator) {
      const { navigator } = navigationContext
      
      // Store the original push, replace, and go methods
      const originalPush = navigator.push
      const originalReplace = navigator.replace
      const originalGo = navigator.go

      // Override navigation methods
      navigator.push = (...args) => {
        setPendingNavigation({ method: 'push', args })
        setModalState({
          isOpen: true,
          type: 'warning',
          title: 'Leave Quiz?',
          message: 'Your quiz will be automatically submitted with your current answers. Unanswered questions will be marked as incorrect. Do you want to continue?',
          confirmText: 'Stay on Quiz',
          cancelText: 'Submit & Leave',
          onConfirm: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setPendingNavigation(null)
          },
          onCancel: handleLeaveAnyway
        })
      }

      navigator.replace = (...args) => {
        setPendingNavigation({ method: 'replace', args })
        setModalState({
          isOpen: true,
          type: 'warning',
          title: 'Leave Quiz?',
          message: 'Your quiz will be automatically submitted with your current answers. Unanswered questions will be marked as incorrect. Do you want to continue?',
          confirmText: 'Stay on Quiz',
          cancelText: 'Submit & Leave',
          onConfirm: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setPendingNavigation(null)
          },
          onCancel: handleLeaveAnyway
        })
      }

      navigator.go = (...args) => {
        setPendingNavigation({ method: 'go', args })
        setModalState({
          isOpen: true,
          type: 'warning',
          title: 'Leave Quiz?',
          message: 'Your quiz will be automatically submitted with your current answers. Unanswered questions will be marked as incorrect. Do you want to continue?',
          confirmText: 'Stay on Quiz',
          cancelText: 'Submit & Leave',
          onConfirm: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setPendingNavigation(null)
          },
          onCancel: handleLeaveAnyway
        })
      }

      // Cleanup: restore original methods
      unblockRef.current = () => {
        navigator.push = originalPush
        navigator.replace = originalReplace
        navigator.go = originalGo
      }

      return () => {
        if (unblockRef.current) {
          unblockRef.current()
        }
      }
    }
  }, [result, allowNavigation, navigationContext, pendingNavigation])

  // Execute pending navigation when allowNavigation becomes true
  useEffect(() => {
    if (allowNavigation && pendingNavigation && navigationContext?.navigator) {
      const { navigator } = navigationContext
      
      // Restore original methods
      if (unblockRef.current) {
        unblockRef.current()
      }

      // Execute pending navigation
      setTimeout(() => {
        if (pendingNavigation.method === 'push') {
          navigator.push(...pendingNavigation.args)
        } else if (pendingNavigation.method === 'replace') {
          navigator.replace(...pendingNavigation.args)
        } else if (pendingNavigation.method === 'go') {
          navigator.go(...pendingNavigation.args)
        }
        setPendingNavigation(null)
      }, 50)
    }
  }, [allowNavigation, pendingNavigation, navigationContext])

  // Prevent page refresh/close during quiz
  useEffect(() => {
    if (!result) {
      const handleBeforeUnload = (e) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [result])

  const updateAnswer = (value) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false })
  }

  const submit = async () => {
    // Check if all questions are answered
    const unanswered = answers.some((a, i) => a === null || a === '')
    if (unanswered) {
      setModalState({
        isOpen: true,
        type: 'warning',
        title: 'Unanswered Questions',
        message: 'Some questions are not answered. Do you want to submit anyway? Your unanswered questions will be marked as incorrect.',
        onConfirm: () => {
          closeModal()
          submitQuiz()
        }
      })
      return
    }

    await submitQuiz()
  }

  const submitQuiz = async (isAutoSubmit = false) => {
    setSubmitting(true)
    try {
      const res = await quizApi.submit({ 
        questions: quiz.questions, 
        responses: answers, 
        topic: quiz.topic, 
        difficulty: quiz.difficulty,
        pdfId: pdfId || quiz.pdfId, // Use pdfId prop or fallback to quiz.pdfId
        quizId: quiz.quizId, // Include quizId for tracking
        isReattempt: !!originalAttemptId, // Flag as reattempt if originalAttemptId exists
        originalAttemptId: originalAttemptId || null // Reference to original attempt
      })
      setResult(res)
      setAllowNavigation(true) // Allow navigation after successful submission
      
      // If auto-submit, proceed with pending navigation after a brief delay
      if (isAutoSubmit && pendingNavigation) {
        setTimeout(() => {
          if (navigationContext?.navigator && unblockRef.current) {
            unblockRef.current()
            const { navigator } = navigationContext
            if (pendingNavigation.method === 'push') {
              navigator.push(...pendingNavigation.args)
            } else if (pendingNavigation.method === 'replace') {
              navigator.replace(...pendingNavigation.args)
            } else if (pendingNavigation.method === 'go') {
              navigator.go(...pendingNavigation.args)
            }
            setPendingNavigation(null)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit quiz. Please check your connection and try again.',
        onConfirm: closeModal,
        showCancel: false
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLeaveAnyway = async () => {
    // Show submitting state in modal
    setModalState(prev => ({
      ...prev,
      isOpen: true,
      type: 'info',
      title: 'Submitting Quiz...',
      message: 'Please wait while we save your progress and submit your quiz.',
      showCancel: false,
      confirmText: 'Submitting...',
      disabled: true,
      onConfirm: () => {} // Disabled during submission
    }))
    
    // Auto-submit the quiz with current answers
    await submitQuiz(true)
    
    // Close modal after submission
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const isAnswered = answers[index] !== null && answers[index] !== ''

  if (result) {
    return (
      <div className={styles.results}> 
        <button 
          className={styles.backButton}
          onClick={() => navigate(-1)}
          title="Go back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>
        <div className={styles.resultsHeader}>
          <h2 className={styles.completionTitle}>
            <span className={styles.completionIcon}>🎉</span>
            Quiz Completed!
          </h2>
          <div className={styles.scoreCard}>
            <div className={styles.mainScoreSection}>
              <div className={styles.scoreCircle}>
                <div className={styles.mainScore}>{result.score}%</div>
                <div className={styles.mainScoreLabel}>SCORE</div>
              </div>
            </div>
            <div className={styles.scoreDetails}>
              <div className={styles.scoreDetailItem}>
                <div className={styles.iconBox} data-type="correct">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className={styles.scoreDetailContent}>
                  <span className={styles.scoreDetailLabel}>Correct</span>
                  <span className={styles.scoreDetailValue}>{result.correct}</span>
                </div>
              </div>
              <div className={styles.scoreDetailItem}>
                <div className={styles.iconBox} data-type="wrong">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div className={styles.scoreDetailContent}>
                  <span className={styles.scoreDetailLabel}>Wrong</span>
                  <span className={styles.scoreDetailValue}>{result.total - result.correct}</span>
                </div>
              </div>
              <div className={styles.scoreDetailItem}>
                <div className={styles.iconBox} data-type="total">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                  </svg>
                </div>
                <div className={styles.scoreDetailContent}>
                  <span className={styles.scoreDetailLabel}>Total</span>
                  <span className={styles.scoreDetailValue}>{result.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.resultsControls}>
          <button 
            className={styles.reviewButton}
            onClick={() => setShowExplanations(!showExplanations)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            {showExplanations ? 'Hide Explanations' : 'Review Answers'}
          </button>
          <button className={styles.reattemptButton} onClick={onExit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Reattempt
          </button>
        </div>

        {showExplanations && result.results && (
          <div className={styles.explanationsList}>
            <h3>📝 Detailed Results</h3>
            {result.results.map((r, idx) => {
              const question = quiz.questions[idx]
              return (
                <div 
                  key={r.questionId} 
                  className={`${styles.explanationCard} ${r.isCorrect ? styles.correct : styles.incorrect}`}
                >
                  <div className={styles.explanationHeader}>
                    <span className={styles.questionNumberBadge}>Question {idx + 1}</span>
                    <span className={styles.resultBadge}>
                      {r.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                      {question.type !== 'MCQ' && ` ${r.score}%`}
                    </span>
                  </div>
                  
                  <div className={styles.explanationQuestion}>
                    <strong>[{question.type}]</strong> {question.question}
                  </div>

                  {question.type === 'MCQ' && (
                    <>
                      <div className={`${styles.explanationAnswer} ${styles.userAnswer}`}>
                        <strong>Your Answer</strong>
                        <p style={{ margin: 0, fontSize: '15px' }}>{question.options[r.userAnswer] || 'Not answered'}</p>
                      </div>
                      <div className={`${styles.explanationAnswer} ${styles.correctAnswer}`}>
                        <strong>Correct Answer</strong>
                        <p style={{ margin: 0, fontSize: '15px' }}>{question.options[r.correctAnswer]}</p>
                      </div>
                    </>
                  )}

                  {question.type !== 'MCQ' && (
                    <>
                      <div className={`${styles.explanationAnswer} ${styles.userAnswer}`}>
                        <strong>Your Answer</strong>
                        <p className={styles.textAnswer}>{r.userAnswer || 'Not answered'}</p>
                      </div>
                      <div className={`${styles.explanationAnswer} ${styles.correctAnswer}`}>
                        <strong>Model Answer</strong>
                        <p className={styles.textAnswer}>{r.correctAnswer}</p>
                      </div>
                    </>
                  )}

                  <div className={styles.explanationText}>
                    <strong>💡 Explanation:</strong>
                    <p>{r.explanation}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.player}>
      <div className={styles.playerHeader}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressInfo}>
          Question {index + 1} of {quiz.questions.length}
        </div>
      </div>

      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <span className={styles.questionType}>{q.type}</span>
          <span className={styles.questionNumber}>#{index + 1}</span>
        </div>
        
        <h2 className={styles.questionText}>{q.question}</h2>

        {q.type === 'MCQ' && (
          <div className={styles.mcqOptions}>
            {q.options.map((opt, i) => (
              <label 
                key={i} 
                className={`${styles.mcqOption} ${answers[index] === i ? styles.selected : ''}`}
              >
                <input 
                  type="radio" 
                  name={`q${index}`} 
                  checked={answers[index] === i} 
                  onChange={() => updateAnswer(i)} 
                />
                <span className={styles.optionLabel}>{String.fromCharCode(65 + i)}</span>
                <span className={styles.optionText}>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === 'SAQ' && (
          <div className={styles.textAnswerSection}>
            <label className={styles.textAnswerLabel}>
              Your Answer (2-3 sentences):
              <textarea 
                value={answers[index] || ''} 
                onChange={(e) => updateAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className={styles.textAnswerInput}
                rows="4"
              />
            </label>
          </div>
        )}

        {q.type === 'LAQ' && (
          <div className={styles.textAnswerSection}>
            <label className={styles.textAnswerLabel}>
              Your Answer (Detailed paragraph):
              <textarea 
                value={answers[index] || ''} 
                onChange={(e) => updateAnswer(e.target.value)}
                placeholder="Provide a detailed answer covering all key points..."
                className={styles.textAnswerInput}
                rows="8"
              />
            </label>
          </div>
        )}
      </div>

      <div className={styles.playerNav}>
        <button 
          className="btn secondary" 
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          ← Previous
        </button>
        
        <div className={styles.answerStatus}>
          {isAnswered ? '✅ Answered' : '⚠️ Not answered'}
        </div>

        {index < quiz.questions.length - 1 ? (
          <button 
            className="btn" 
            onClick={() => setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
          >
            Next →
          </button>
        ) : (
          <button 
            className="btn" 
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? '⏳ Submitting...' : '✅ Submit Quiz'}
          </button>
        )}
      </div>

      <div className={styles.answerGrid}>
        {quiz.questions.map((_, i) => (
          <button
            key={i}
            className={`${styles.answerDot} ${answers[i] !== null && answers[i] !== '' ? styles.answered : ''} ${i === index ? styles.current : ''}`}
            onClick={() => setIndex(i)}
            title={`Question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Custom Modal */}
      <QuizModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm || closeModal}
        onCancel={modalState.onCancel}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showCancel={modalState.showCancel !== false}
        confirmText={modalState.confirmText || 'OK'}
        cancelText={modalState.cancelText || 'Cancel'}
        disabled={modalState.disabled || false}
      />
    </div>
  )
}
