import React from 'react'
import styles from './QuizModal.module.css'

export default function QuizModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onCancel,
  title, 
  message, 
  type = 'warning', 
  confirmText = 'OK', 
  cancelText = 'Cancel', 
  showCancel = true 
}) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'info':
        return 'ℹ️'
      case 'question':
        return '❓'
      default:
        return '💬'
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  const handleOverlayClick = () => {
    // Don't allow closing by clicking overlay for critical modals
    if (type !== 'error') {
      handleCancel()
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalIcon}>{getIcon()}</span>
          <h3 className={styles.modalTitle}>{title}</h3>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.modalMessage}>{message}</p>
        </div>
        
        <div className={styles.modalFooter}>
          {showCancel && (
            <button 
              className={`${styles.modalButton} ${styles.cancelButton}`}
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}
          <button 
            className={`${styles.modalButton} ${styles.confirmButton}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
