import React from 'react'
import styles from './Sidebar.module.css'

export default function Sidebar({ keyPoints = [], isCollapsed = false, onGenerateQuiz }) {
  const truncateByWords = (text, maxWords = 20) => {
    const words = text.split(/\s+/)
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ') + '...'
  }

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header} style={{ opacity: isCollapsed ? 0 : 1 }}>
        <h3 className={styles.title}>Key Points</h3>
      </div>
      <input className={styles.search} placeholder="Search in this book" style={{ opacity: isCollapsed ? 0 : 1 }} />
      <div className={styles.list} style={{ opacity: isCollapsed ? 0 : 1 }}>
        {keyPoints.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>�</span>
            <p className={styles.emptyText}>No key points available</p>
          </div>
        ) : (
          keyPoints.map((point, idx) => (
            <div 
              key={idx} 
              className={styles.item}
              title={point}
            >
              <span className={styles.itemBullet}>{idx + 1}.</span>
              <span className={styles.itemText}>{truncateByWords(point, 20)}</span>
            </div>
          ))
        )}
      </div>
      
      {/* Generate Quiz Button */}
      {onGenerateQuiz && (
        <button 
          className={styles.generateQuizButton}
          onClick={onGenerateQuiz}
          style={{ opacity: isCollapsed ? 0 : 1, pointerEvents: isCollapsed ? 'none' : 'auto' }}
        >
          <span className={styles.quizIcon}>🎯</span>
          <span className={styles.quizText}>Generate Quiz</span>
        </button>
      )}
    </aside>
  )
}
