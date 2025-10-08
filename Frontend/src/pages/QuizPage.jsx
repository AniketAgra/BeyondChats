import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import QuizGenerator from '../components/Quiz/QuizGenerator.jsx'
import QuizPlayer from '../components/Quiz/QuizPlayer.jsx'

export default function QuizPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const pdfId = searchParams.get('pdfId')
  const reuseQuizId = searchParams.get('reuseQuizId')
  const originalAttemptId = searchParams.get('originalAttemptId')
  const [quiz, setQuiz] = useState(null)
  
  console.log('QuizPage - pdfId from URL:', pdfId)
  console.log('QuizPage - reuseQuizId from URL:', reuseQuizId)
  console.log('QuizPage - originalAttemptId from URL:', originalAttemptId)
  
  // Require pdfId or reuseQuizId to access the quiz page
  if (!pdfId && !reuseQuizId) {
    return (
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <h2>📝 Quiz Generator</h2>
          <p style={{ marginBottom: 20 }}>Quizzes can only be created from your library for a specific PDF.</p>
          <button 
            className="btn" 
            onClick={() => navigate('/library')}
          >
            📚 Go to Library
          </button>
        </div>
      </div>
    )
  }
  
  if (quiz) {
    return (
      <div className="container">
        <QuizPlayer quiz={quiz} onExit={() => setQuiz(null)} pdfId={pdfId} originalAttemptId={originalAttemptId} />
      </div>
    )
  }
  
  return (
    <div className="container">
      <QuizGenerator onStart={setQuiz} pdfId={pdfId} reuseQuizId={reuseQuizId} />
    </div>
  )
}
