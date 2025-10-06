import React, { useState } from 'react'
import QuizGenerator from '../components/Quiz/QuizGenerator.jsx'
import QuizPlayer from '../components/Quiz/QuizPlayer.jsx'

export default function QuizPage() {
  const [quiz, setQuiz] = useState(null)
  if (quiz) return <div className="container"><QuizPlayer quiz={quiz} onExit={() => setQuiz(null)} /></div>
  return <div className="container"><QuizGenerator onStart={setQuiz} /></div>
}
