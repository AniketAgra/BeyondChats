import React, { useEffect, useRef, useState } from 'react'
import styles from './ChatPanel.module.css'
import { chatApi } from '../../utils/api.js'

export default function ChatPanel({ pdfId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const threadRef = useRef(null)
  useEffect(() => { (async () => {
    try {
      const items = await chatApi.list(pdfId)
      setMessages(items)
    } catch {}
  })() }, [pdfId])

  // Keep the view pinned to the latest messages
  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    try {
      const msgs = await chatApi.send({ content: input, pdfId })
      setMessages((m) => [...m, ...msgs])
    } catch (e) {
      // fallback optimistic UI
      setMessages((m) => [...m, { role: 'user', content: input }, { role: 'ai', content: 'Aurora: (offline) reply.' }])
    } finally {
      setInput('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.thread} ref={threadRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <p className={styles.emptyText}>Start a conversation</p>
            <p className={styles.emptySubtext}>Ask me anything about this document</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={m._id || i} className={m.role === 'ai' ? styles.ai : styles.user}>{m.content}</div>
          ))
        )}
      </div>
      <div className={styles.inputRow}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything..." 
        />
        <button 
          className={styles.sendButton} 
          onClick={send}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
