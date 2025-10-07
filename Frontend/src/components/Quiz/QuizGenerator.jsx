import React, { useState, useEffect } from 'react'
import styles from './Quiz.module.css'
import { quizApi, pdfApi } from '../../utils/api.js'

export default function QuizGenerator({ onStart, pdfId }) {
  const [difficulty, setDifficulty] = useState('medium')
  const [topic, setTopic] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [questionTypes, setQuestionTypes] = useState({ MCQ: true, SAQ: false, LAQ: false })
  const [questionCount, setQuestionCount] = useState(10)
  const [pdfs, setPdfs] = useState([])
  const [selectedPdf, setSelectedPdf] = useState(pdfId || '')
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('')

  useEffect(() => {
    // Only load PDFs if we're in custom mode (no pdfId provided)
    if (!pdfId) {
      loadPdfs()
    } else {
      // If pdfId is provided, fetch just that PDF's title
      loadPdfTitle(pdfId)
    }
  }, [pdfId])

  const loadPdfs = async () => {
    try {
      const items = await pdfApi.list()
      setPdfs(items || [])
    } catch (error) {
      console.error('Failed to load PDFs:', error)
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

    setLoading(true)
    try {
      const quiz = await quizApi.generate({ 
        pdfId: selectedPdf || undefined,
        difficulty, 
        types, 
        topic: topic || undefined,
        count: questionCount 
      })
      setPreview(quiz)
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      alert('Failed to generate quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestionType = (type) => {
    setQuestionTypes(prev => ({ ...prev, [type]: !prev[type] }))
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>
          📝 Generate Quiz {pdfId && selectedPdfTitle && `for "${selectedPdfTitle}"`}
        </h2>
        
        <div className={styles.configSection}>
          {/* Only show PDF selector in custom mode (when no pdfId provided) */}
          {!pdfId && (
            <label className={styles.label}>
              Select PDF (Optional)
              <select 
                value={selectedPdf} 
                onChange={(e) => setSelectedPdf(e.target.value)}
                className={styles.select}
              >
                <option value="">-- No PDF (General Quiz) --</option>
                {pdfs.map((pdf) => (
                  <option key={pdf._id} value={pdf._id}>
                    {pdf.title || pdf.filename}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Show locked PDF info when pdfId is provided */}
          {pdfId && (
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
          )}

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

      {preview && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>📋 Generated Quiz Preview</h3>
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
