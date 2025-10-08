import React, { useState } from 'react'
import { FaPlus, FaFile, FaBrain, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa'
import styles from './ChatSidebar.module.css'

export default function ChatSidebar({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onCreateSession,
  onDeleteSession,
  onRenameSession 
}) {
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const pdfSessions = sessions.filter(s => s.type === 'pdf')
  const generalSessions = sessions.filter(s => s.type === 'general')

  const handleStartEdit = (session) => {
    setEditingId(session._id)
    setEditTitle(session.title)
  }

  const handleSaveEdit = (sessionId) => {
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim())
    }
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <FaBrain size={24} />
          <span>AI Study Buddy</span>
        </div>
      </div>

      {/* New Chat Button */}
      <button 
        className={styles.newChatBtn}
        onClick={() => onCreateSession('general')}
      >
        <FaPlus size={16} />
        <span>New Chat</span>
      </button>

      {/* General Chats */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <FaBrain size={14} />
          <span>Study Buddy Chats</span>
        </div>
        <div className={styles.sessionList}>
          {generalSessions.length === 0 ? (
            <div className={styles.emptyState}>
              No chats yet. Start a new conversation!
            </div>
          ) : (
            generalSessions.map(session => (
              <div
                key={session._id}
                className={`${styles.sessionItem} ${
                  session._id === activeSessionId ? styles.active : ''
                }`}
              >
                {editingId === session._id ? (
                  <div className={styles.editMode}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(session._id)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      autoFocus
                      className={styles.editInput}
                    />
                    <div className={styles.editActions}>
                      <button onClick={() => handleSaveEdit(session._id)}>
                        <FaCheck size={12} />
                      </button>
                      <button onClick={handleCancelEdit}>
                        <FaTimes size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className={styles.sessionContent}
                      onClick={() => onSelectSession(session._id)}
                    >
                      <div className={styles.sessionTitle}>{session.title}</div>
                      <div className={styles.sessionMeta}>
                        {formatDate(session.lastMessageAt)}
                      </div>
                    </div>
                    <div className={styles.sessionActions}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(session)
                        }}
                        className={styles.actionBtn}
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession(session._id)
                        }}
                        className={styles.actionBtn}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* PDF-Specific Chats */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <FaFile size={14} />
          <span>PDF Chats</span>
        </div>
        <div className={styles.sessionList}>
          {pdfSessions.length === 0 ? (
            <div className={styles.emptyState}>
              Open a PDF to start chatting about it!
            </div>
          ) : (
            pdfSessions.map(session => (
              <div
                key={session._id}
                className={`${styles.sessionItem} ${
                  session._id === activeSessionId ? styles.active : ''
                }`}
              >
                {editingId === session._id ? (
                  <div className={styles.editMode}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(session._id)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      autoFocus
                      className={styles.editInput}
                    />
                    <div className={styles.editActions}>
                      <button onClick={() => handleSaveEdit(session._id)}>
                        <FaCheck size={12} />
                      </button>
                      <button onClick={handleCancelEdit}>
                        <FaTimes size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className={styles.sessionContent}
                      onClick={() => onSelectSession(session._id)}
                    >
                      <div className={styles.sessionTitle}>
                        {session.pdfId?.title || session.title}
                      </div>
                      <div className={styles.sessionMeta}>
                        {formatDate(session.lastMessageAt)} • {session.messageCount} msgs
                      </div>
                    </div>
                    <div className={styles.sessionActions}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(session)
                        }}
                        className={styles.actionBtn}
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession(session._id)
                        }}
                        className={styles.actionBtn}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
