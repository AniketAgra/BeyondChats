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
  return (
    <div className={styles.panel}>
      <div className={styles.thread} ref={threadRef}>
        {messages.map((m, i) => (
          <div key={m._id || i} className={m.role === 'ai' ? styles.ai : styles.user}>{m.content}</div>
        ))}
      </div>
      <div className={styles.inputRow}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..." />
        <button className="btn" onClick={send}>Send</button>
      </div>
    </div>
  )
}
