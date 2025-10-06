import React, { useMemo, useState } from 'react'
import styles from './Quiz.module.css'
import { quizApi } from '../../utils/api.js'

export default function QuizPlayer({ quiz, onExit }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null))
  const [result, setResult] = useState(null)
  const q = quiz.questions[index]
  const progress = Math.round(((index) / quiz.questions.length) * 100)

  const submit = async () => {
    const res = await quizApi.submit({ questions: quiz.questions, responses: answers })
    setResult(res)
  }

  if (result) {
    return (
      <div className={styles.player}> 
        <h2>Score: {result.score}%</h2>
        <p>
          Correct {result.correct}/{result.total}
        </p>
        <button className="btn" onClick={onExit}>Back</button>
      </div>
    )
  }

  return (
    <div className={styles.player}>
      <div className={styles.progress}><div style={{ width: `${progress}%` }} /></div>
      <h2>{q.question}</h2>
      {q.type === 'MCQ' && (
        <div className={styles.options}>
          {q.options.map((opt, i) => (
            <label key={i} className={answers[index]===i?styles.selected:''}>
              <input type="radio" name={`q${index}`} checked={answers[index]===i} onChange={() => setAnswers((a)=>{const c=[...a];c[index]=i;return c})} />
              {opt}
            </label>
          ))}
        </div>
      )}

      <div className={styles.playerNav}>
        <button className="btn secondary" onClick={() => setIndex((i) => Math.max(0, i-1))}>Previous</button>
        {index < quiz.questions.length - 1 ? (
          <button className="btn" onClick={() => setIndex((i) => Math.min(quiz.questions.length-1, i+1))}>Next</button>
        ) : (
          <button className="btn" onClick={submit}>Submit</button>
        )}
      </div>
    </div>
  )
}
