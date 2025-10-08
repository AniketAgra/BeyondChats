import React from 'react'
import styles from './ReattemptModal.module.css'

export default function ReattemptModal({ attempt, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>🔄</span>
        </div>
        
        <h2 className={styles.title}>Reattempt Quiz?</h2>
        
        <p className={styles.description}>
          You're about to reattempt this quiz with the exact same questions. 
          This is a great way to test your improvement!
        </p>

        <div className={styles.quizDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>📚 Topic:</span>
            <span className={styles.detailValue}>{attempt.topic || 'General Quiz'}</span>
          </div>
          
          {attempt.pdf && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>📄 Source:</span>
              <span className={styles.detailValue}>{attempt.pdf.title || attempt.pdf.filename}</span>
            </div>
          )}
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>🎯 Difficulty:</span>
            <span className={styles.detailValue}>
              {attempt.difficulty === 'easy' && '🟢 Easy'}
              {attempt.difficulty === 'medium' && '🟡 Medium'}
              {attempt.difficulty === 'hard' && '🔴 Hard'}
            </span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>❓ Questions:</span>
            <span className={styles.detailValue}>{attempt.total} questions</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>📊 Previous Score:</span>
            <span className={styles.detailValue}>{attempt.score}%</span>
          </div>
        </div>

        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>ℹ️</span>
          <p className={styles.infoText}>
            Your new attempt will be saved separately and won't affect your previous score.
          </p>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            <span className={styles.buttonIcon}>🚀</span>
            Start Reattempt
          </button>
        </div>
      </div>
    </div>
  )
}
