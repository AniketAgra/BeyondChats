import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QuizGenerator from '../components/Quiz/QuizGenerator.jsx'
import QuizPlayer from '../components/Quiz/QuizPlayer.jsx'

export default function QuizPage() {
  const [searchParams] = useSearchParams()
  const pdfId = searchParams.get('pdfId')
  const [quiz, setQuiz] = useState(null)
  
  if (quiz) {
    return (
      <div className="container">
        <QuizPlayer quiz={quiz} onExit={() => setQuiz(null)} pdfId={pdfId} />
      </div>
    )
  }
  
  return (
    <div className="container">
      <QuizGenerator onStart={setQuiz} pdfId={pdfId} />
    </div>
  )
}
