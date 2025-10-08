import React, { useState, useEffect } from 'react'
import styles from './Quiz.module.css'
import { quizApi, pdfApi } from '../../utils/api.js'

export default function QuizGenerator({ onStart, pdfId, reuseQuizId }) {
  const [difficulty, setDifficulty] = useState('medium')
  const [topic, setTopic] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [questionTypes, setQuestionTypes] = useState({ MCQ: true, SAQ: false, LAQ: false })
  const [questionCount, setQuestionCount] = useState(10)
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('')

  useEffect(() => {
    // If reuseQuizId is provided, load that quiz immediately and start it
    if (reuseQuizId) {
      loadExistingQuizAndStart(reuseQuizId)
    } else if (pdfId) {
      // If pdfId is provided, fetch that PDF's title
      loadPdfTitle(pdfId)
    }
  }, [pdfId, reuseQuizId])

  const loadExistingQuizAndStart = async (quizId) => {
    setLoading(true)
    try {
      const quiz = await quizApi.getQuiz(quizId)
      // Auto-start the quiz directly without showing intermediate page
      const quizData = {
        quizId: quiz._id,
        difficulty: quiz.difficulty,
        types: quiz.types,
        topic: quiz.topic,
        questions: quiz.questions,
        pdfId: quiz.pdf?._id || pdfId, // Include PDF reference from quiz or URL
        isReattempt: true
      }
      
      // Directly start the quiz
      onStart(quizData)
    } catch (error) {
      console.error('Failed to load quiz:', error)
      
      // Extract detailed error information
      let errorMessage = 'Failed to load quiz. Please try again.'
      if (error.response) {
        console.error('Error response:', error.response.data)
        console.error('Error status:', error.response.status)
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage
      } else if (error.request) {
        console.error('No response received:', error.request)
        errorMessage = 'Cannot connect to server. Please check if the backend is running.'
      } else {
        console.error('Error message:', error.message)
        errorMessage = error.message
      }
      
      alert(errorMessage)
      setLoading(false)
    }
  }

  const loadPdfTitle = async (id) => {
    try {
      const pdf = await pdfApi.get(id)
      setSelectedPdfTitle(pdf.title || pdf.filename || 'Selected PDF')
    } catch (error) {
      console.error('Failed to load PDF title:', error)
      setSelectedPdfTitle('Selected PDF')
    }
  }

  const getSelectedTypes = () => {
    return Object.keys(questionTypes).filter(type => questionTypes[type])
  }

  const generate = async () => {
    const types = getSelectedTypes()
    if (types.length === 0) {
      alert('Please select at least one question type')
      return
    }

    // Validate that pdfId is provided
    if (!pdfId) {
      alert('PDF is required to generate a quiz')
      return
    }

    setLoading(true)
    try {
      const payload = { 
        pdfId: pdfId,
        difficulty, 
        types, 
        topic: topic || undefined,
        count: questionCount,
        reuseQuizId: reuseQuizId || undefined
      }
      console.log('Generating quiz with payload:', payload)
      const quiz = await quizApi.generate(payload)
      
      // Show preview for all quizzes (removed auto-start behavior)
      setPreview(quiz)
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      
      // Extract detailed error information
      let errorMessage = 'Failed to generate quiz. Please try again.'
      if (error.response) {
        // Server responded with error
        console.error('Error response:', error.response.data)
        console.error('Error status:', error.response.status)
        console.error('Full error data:', JSON.stringify(error.response.data, null, 2))
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage
      } else if (error.request) {
        // Request was made but no response
        console.error('No response received:', error.request)
        errorMessage = 'Cannot connect to server. Please check if the backend is running.'
      } else {
        // Error in request setup
        console.error('Error message:', error.message)
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestionType = (type) => {
    setQuestionTypes(prev => ({ ...prev, [type]: !prev[type] }))
  }

  // Show loading state while quiz is being loaded for reattempt
  if (loading && reuseQuizId) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: 24 }}>
          <p>⏳ Loading quiz...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>
          📝 Generate Quiz {selectedPdfTitle && `for "${selectedPdfTitle}"`}
        </h2>
        
        <div className={styles.configSection}>
          {/* Show locked PDF info */}
          <div className={styles.lockedPdfInfo}>
            <label className={styles.label}>
              Quiz Source
              <div className={styles.lockedPdfBadge}>
                <span className={styles.pdfIcon}>📄</span>
                <span className={styles.pdfTitle}>{selectedPdfTitle}</span>
                <span className={styles.lockedIcon}>🔒</span>
              </div>
            </label>
          </div>

          <label className={styles.label}>
            Topic (Optional)
            <input 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g., Machine Learning, Calculus" 
              className={styles.input}
            />
          </label>

          <label className={styles.label}>
            Difficulty Level
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className={styles.select}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <label className={styles.label}>
            Number of Questions
            <input 
              type="number" 
              value={questionCount} 
              onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 10)))} 
              min="1" 
              max="20"
              className={styles.input}
            />
          </label>

          <div className={styles.questionTypesSection}>
            <span className={styles.label}>Question Types:</span>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={questionTypes.MCQ} 
                  onChange={() => toggleQuestionType('MCQ')}
                />
                <span>MCQ (Multiple Choice)</span>
              </label>
              <label className={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={questionTypes.SAQ} 
                  onChange={() => toggleQuestionType('SAQ')}
                />
                <span>SAQ (Short Answer)</span>
              </label>
              <label className={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={questionTypes.LAQ} 
                  onChange={() => toggleQuestionType('LAQ')}
                />
                <span>LAQ (Long Answer)</span>
              </label>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button 
              className="btn" 
              onClick={generate} 
              disabled={loading}
            >
              {loading ? '⏳ Generating...' : '✨ Generate Quiz'}
            </button>
            {preview && (
              <button 
                className="btn secondary" 
                onClick={() => onStart(preview)}
              >
                🎯 Start Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {preview && !preview.isReattempt && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>
              📋 Generated Quiz Preview
            </h3>
            <div className={styles.previewInfo}>
              <span className={styles.badge}>{preview.difficulty}</span>
              <span className={styles.badge}>{preview.questions.length} Questions</span>
              <span className={styles.badge}>{preview.types.join(', ')}</span>
              {preview.topic && <span className={styles.badge}>Topic: {preview.topic}</span>}
            </div>
            <div className={styles.previewList}>
              {preview.questions.map((q, idx) => (
                <div key={q.id} className={styles.previewItem}>
                  <div className={styles.previewQuestionHeader}>
                    <div className={styles.previewQuestionNumber}>Q{idx + 1}</div>
                    <span className={styles.questionType}>{q.type}</span>
                  </div>
                  <div className={styles.previewQuestionText}>
                    {q.question}
                  </div>
                  {q.type === 'MCQ' && (
                    <ul className={styles.previewOptions}>
                      {q.options.map((opt, i) => (
                        <li 
                          key={i} 
                          data-option={String.fromCharCode(65 + i)}
                          className={i === q.answerIndex ? styles.correctOption : ''}
                        >
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.explanation && (
                    <div className={styles.previewExplanation}>
                      <strong>💡 Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      }
    </div>
  )
}
