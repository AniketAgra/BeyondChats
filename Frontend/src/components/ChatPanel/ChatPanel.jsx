import React, { useState } from 'react'
import styles from './ChatPanel.module.css'

export default function ChatPanel() {
  const [messages, setMessages] = useState([{ role: 'ai', content: 'How can I help you with this textbook?' }])
  const [input, setInput] = useState('')
  const send = () => {
    if (!input.trim()) return
    setMessages((m) => [...m, { role: 'user', content: input }, { role: 'ai', content: 'Stub response about your PDF.' }])
    setInput('')
  }
  return (
    <div className={styles.panel}>
      <div className={styles.thread}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'ai' ? styles.ai : styles.user}>{m.content}</div>
        ))}
      </div>
      <div className={styles.inputRow}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..." />
        <button className="btn" onClick={send}>Send</button>
      </div>
    </div>
  )
}
