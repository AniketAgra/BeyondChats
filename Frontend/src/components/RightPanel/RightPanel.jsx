import React, { useState } from 'react'
import styles from './RightPanel.module.css'
import ChatPanel from '../ChatPanel/ChatPanel'
import NotesPanel from '../NotesPanel/NotesPanel'

export default function RightPanel({ pdfId, notePdfId, page }) {
  const [tab, setTab] = useState('chat')

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={tab==='chat' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
            onClick={() => setTab('chat')}
          >Chats</button>
          <button
            className={tab==='notes' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
            onClick={() => setTab('notes')}
          >Notes</button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.scrollArea}>
          <section className={tab==='chat' ? `${styles.section} ${styles.active}` : styles.section}>
            <div className={styles.sectionInner}>
              <div className={styles.sectionHeader}>Conversation</div>
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
        </div>
      </div>
    </aside>
  )
}
