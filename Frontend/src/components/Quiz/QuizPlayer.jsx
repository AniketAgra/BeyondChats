import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, UNSAFE_NavigationContext } from 'react-router-dom'
import styles from './Quiz.module.css'
import { quizApi } from '../../utils/api.js'
import QuizModal from './QuizModal.jsx'

export default function QuizPlayer({ quiz, onExit, pdfId }) {
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
          message: 'You have an active quiz in progress. Please submit your quiz before leaving, or your progress will be lost.',
          confirmText: 'Stay on Quiz',
          cancelText: 'Leave Anyway',
          onConfirm: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setPendingNavigation(null)
          },
          onCancel: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setAllowNavigation(true)
            // Execute the pending navigation after allowing
            setTimeout(() => {
              if (pendingNavigation) {
                originalPush(...pendingNavigation.args)
              }
            }, 100)
          }
        })
      }

      navigator.replace = (...args) => {
        setPendingNavigation({ method: 'replace', args })
        setModalState({
          isOpen: true,
          type: 'warning',
          title: 'Leave Quiz?',
          message: 'You have an active quiz in progress. Please submit your quiz before leaving, or your progress will be lost.',
          confirmText: 'Stay on Quiz',
          cancelText: 'Leave Anyway',
          onConfirm: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setPendingNavigation(null)
          },
          onCancel: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setAllowNavigation(true)
            setTimeout(() => {
              if (pendingNavigation) {
                originalReplace(...pendingNavigation.args)
              }
            }, 100)
          }
        })
      }

      navigator.go = (...args) => {
        setPendingNavigation({ method: 'go', args })
        setModalState({
          isOpen: true,
          type: 'warning',
          title: 'Leave Quiz?',
          message: 'You have an active quiz in progress. Please submit your quiz before leaving, or your progress will be lost.',
          confirmText: 'Stay on Quiz',
          cancelText: 'Leave Anyway',
          onConfirm: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setPendingNavigation(null)
          },
          onCancel: () => {
            setModalState(prev => ({ ...prev, isOpen: false }))
            setAllowNavigation(true)
            setTimeout(() => {
              if (pendingNavigation) {
                originalGo(...pendingNavigation.args)
              }
            }, 100)
          }
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

  const submitQuiz = async () => {
    setSubmitting(true)
    try {
      const res = await quizApi.submit({ 
        questions: quiz.questions, 
        responses: answers, 
        topic: quiz.topic, 
        difficulty: quiz.difficulty,
        pdfId 
      })
      setResult(res)
      setAllowNavigation(true) // Allow navigation after successful submission
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

  const isAnswered = answers[index] !== null && answers[index] !== ''

  if (result) {
    return (
      <div className={styles.results}> 
        <div className={styles.resultsHeader}>
          <h2>🎉 Quiz Completed!</h2>
          <div className={styles.scoreCard}>
            <div className={styles.mainScoreSection}>
              <div className={styles.mainScore}>{result.score}%</div>
              <div className={styles.mainScoreLabel}>Your Score</div>
            </div>
            <div className={styles.scoreDetails}>
              <div className={`${styles.scoreDetailItem} ${styles.correct}`}>
                <span className={styles.scoreDetailLabel}>✅ Correct</span>
                <span className={styles.scoreDetailValue}>{result.correct}</span>
              </div>
              <div className={`${styles.scoreDetailItem} ${styles.incorrect}`}>
                <span className={styles.scoreDetailLabel}>❌ Wrong</span>
                <span className={styles.scoreDetailValue}>{result.total - result.correct}</span>
              </div>
              <div className={`${styles.scoreDetailItem} ${styles.total}`}>
                <span className={styles.scoreDetailLabel}>📊 Total</span>
                <span className={styles.scoreDetailValue}>{result.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.resultsControls}>
          <button 
            className="btn secondary" 
            onClick={() => setShowExplanations(!showExplanations)}
          >
            {showExplanations ? '📖 Hide Explanations' : '📖 Show Explanations'}
          </button>
          <button className="btn" onClick={onExit}>
            🏠 Back to Quiz Generator
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
      />
    </div>
  )
}
