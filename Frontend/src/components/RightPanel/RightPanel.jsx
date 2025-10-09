import React, { useState } from 'react'
import styles from './RightPanel.module.css'
import ChatPanel from '../ChatPanel/ChatPanel'
import NotesPanel from '../NotesPanel/NotesPanel'

export default function RightPanel({ pdfId, notePdfId, page, isCollapsed = false, isOpen = false, onClose, keyPoints = [] }) {
  const [tab, setTab] = useState('chat')

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && <div className={styles.backdrop} onClick={onClose}></div>}
      
      <aside className={`${styles.panel} ${isCollapsed ? styles.collapsed : ''} ${isOpen ? styles.open : ''}`}>
        {/* Close button for mobile */}
        {isOpen && (
          <button className={styles.closeBtn} onClick={onClose} title="Close panel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      
      <div className={styles.header} style={{ opacity: isCollapsed ? 0 : 1 }}>
        <div className={styles.tabs}>
          <button
            className={tab==='chat' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
            onClick={() => setTab('chat')}
            title="Chats"
          >
            <span className={styles.tabText}>Chats</span>
            <span className={styles.tabTextShort}>Chat</span>
          </button>
          <button
            className={tab==='notes' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
            onClick={() => setTab('notes')}
            title="Notes"
          >
            <span className={styles.tabText}>Notes</span>
            <span className={styles.tabTextShort}>Note</span>
          </button>
          <button
            className={tab==='keypoints' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
            onClick={() => setTab('keypoints')}
            title="Key Points"
          >
            <span className={styles.tabText}>Key Points</span>
            <span className={styles.tabTextShort}>Keys</span>
          </button>
        </div>
      </div>

      <div className={styles.content} style={{ opacity: isCollapsed ? 0 : 1 }}>
        <div className={styles.scrollArea}>
          <section className={tab==='chat' ? `${styles.section} ${styles.active}` : styles.section}>
            <div className={styles.sectionInner}>
              {/* <div className={styles.sectionHeader}>AI Assistant</div> */}
              <div className={styles.sectionBody}>
                <ChatPanel pdfId={pdfId} />
              </div>
            </div>
          </section>

          <section className={tab==='notes' ? `${styles.section} ${styles.active}` : styles.section}>
            <div className={styles.sectionInner}>
              <div className={styles.sectionHeader}>Your Notes</div>
              <div className={styles.sectionBody}>
                <NotesPanel pdfId={notePdfId} page={page} />
              </div>
            </div>
          </section>

          <section className={tab==='keypoints' ? `${styles.section} ${styles.active}` : styles.section}>
            <div className={styles.sectionInner}>
              <div className={styles.sectionHeader}>Key Points</div>
              <div className={styles.sectionBody}>
                <div className={styles.keyPointsList}>
                  {keyPoints.length === 0 ? (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>📚</span>
                      <p className={styles.emptyText}>No key points available</p>
                    </div>
                  ) : (
                    keyPoints.map((point, idx) => (
                      <div key={idx} className={styles.keyPointItem}>
                        <span className={styles.keyPointNumber}>{idx + 1}.</span>
                        <span className={styles.keyPointText}>{point}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </aside>
    </>
  )
}
