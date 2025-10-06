import React, { useState } from 'react'
import styles from './Quiz.module.css'
import { quizApi } from '../../utils/api.js'

export default function QuizGenerator({ onStart }) {
  const [difficulty, setDifficulty] = useState('medium')
  const [topic, setTopic] = useState('')
  const [preview, setPreview] = useState(null)

  const generate = async () => {
    const quiz = await quizApi.generate({ difficulty, types: ['MCQ'], topic })
    setPreview(quiz)
  }

  return (
    <div className={styles.generator}>
      <div className="card" style={{ padding: 16 }}>
        <div className={styles.controls}>
          <label>
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option>easy</option>
              <option>medium</option>
              <option>hard</option>
            </select>
          </label>
          <label>
            Topic
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic filter" />
          </label>
          <button className="btn" onClick={generate}>Regenerate Quiz</button>
          {preview && <button className="btn secondary" onClick={() => onStart(preview)}>Start Quiz</button>}
        </div>
      </div>
      {preview && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <h3>Generated Quiz Preview</h3>
          <ol className={styles.previewList}>
            {preview.questions.map((q) => (
              <li key={q.id}>{q.question}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
