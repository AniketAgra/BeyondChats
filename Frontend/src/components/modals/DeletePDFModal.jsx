import React from 'react'
import styles from './DeletePDFModal.module.css'
import { RiDeleteBin6Line, RiAlertLine, RiCloseLine } from 'react-icons/ri'
import { HiOutlineDocumentText, HiOutlineChatAlt2, HiOutlinePencilAlt, HiOutlineChartBar, HiOutlineClipboardList } from 'react-icons/hi'

export default function DeletePDFModal({ open, onClose, onConfirm, pdfName }) {
  if (!open) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <RiCloseLine />
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <RiAlertLine className={styles.icon} />
          </div>
          <h2 className={styles.title}>Delete PDF?</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.pdfName}>
            Are you sure you want to delete <strong>"{pdfName}"</strong>?
          </p>
          
          <div className={styles.warningBox}>
            <p className={styles.warningTitle}>This will permanently remove:</p>
            <ul className={styles.warningList}>
              <li>
                <HiOutlineDocumentText className={styles.itemIcon} />
                <span>The PDF file</span>
              </li>
              <li>
                <HiOutlinePencilAlt className={styles.itemIcon} />
                <span>All notes</span>
              </li>
              <li>
                <HiOutlineChatAlt2 className={styles.itemIcon} />
                <span>All chat messages</span>
              </li>
              <li>
                <HiOutlineClipboardList className={styles.itemIcon} />
                <span>All quizzes and quiz attempts</span>
              </li>
              <li>
                <HiOutlineChartBar className={styles.itemIcon} />
                <span>All learning progress data</span>
              </li>
            </ul>
          </div>

          <p className={styles.finalWarning}>
            <RiAlertLine className={styles.warningIcon} />
            <strong>This action cannot be undone.</strong>
          </p>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.cancelBtn} 
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button 
            className={styles.deleteBtn} 
            onClick={onConfirm}
            type="button"
          >
            <RiDeleteBin6Line className={styles.deleteIcon} />
            Delete PDF
          </button>
        </div>
      </div>
    </div>
  )
}
