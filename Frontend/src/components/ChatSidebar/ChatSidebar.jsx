import React, { useState, useEffect } from 'react'
import { FaPlus, FaFile, FaBrain, FaTrash, FaEdit, FaCheck, FaTimes, FaBars, FaExclamationTriangle } from 'react-icons/fa'
import styles from './ChatSidebar.module.css'
import { pdfApi } from '../../utils/api.js'

export default function ChatSidebar({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onSelectPDF,
  sidebarOpen,
  onToggleSidebar
}) {
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  const [pdfs, setPdfs] = useState([])
  const [loadingPdfs, setLoadingPdfs] = useState(true)

  const pdfSessions = sessions.filter(s => s.type === 'pdf')
  const generalSessions = sessions.filter(s => s.type === 'general')

  // Fetch all user PDFs
  useEffect(() => {
    loadPdfs()
  }, [])

  const loadPdfs = async () => {
    try {
      setLoadingPdfs(true)
      const pdfList = await pdfApi.list()
      setPdfs(pdfList || [])
    } catch (error) {
      console.error('Failed to load PDFs:', error)
      setPdfs([])
    } finally {
      setLoadingPdfs(false)
    }
  }

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

  const handleDeleteClick = (session) => {
    setSessionToDelete(session)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete._id)
    }
    setDeleteModalOpen(false)
    setSessionToDelete(null)
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setSessionToDelete(null)
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
    <>
      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          className={styles.backdrop} 
          onClick={onToggleSidebar}
        />
      )}
      
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
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
                          handleDeleteClick(session)
                        }}
                        className={styles.actionBtn}
                        title="Delete chat"
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

      {/* PDF Chats - Show all PDFs */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <FaFile size={14} />
          <span>PDF Chats</span>
          <span className={styles.sectionCount}>({pdfs.length})</span>
        </div>
        <div className={styles.sessionList}>
          {loadingPdfs ? (
            <div className={styles.emptyState}>
              Loading PDFs...
            </div>
          ) : pdfs.length === 0 ? (
            <div className={styles.emptyState}>
              Upload a PDF to start chatting about it!
            </div>
          ) : (
            pdfs.map(pdf => {
              // Check if there's an active session for this PDF
              const pdfSession = pdfSessions.find(s => s.pdfId?._id === pdf.id)
              const isActive = pdfSession && pdfSession._id === activeSessionId
              
              return (
                <div
                  key={pdf.id}
                  className={`${styles.sessionItem} ${styles.pdfSessionItem} ${
                    isActive ? styles.active : ''
                  }`}
                  onClick={() => onSelectPDF(pdf.id)}
                  title={`Chat about: ${pdf.title || pdf.filename}`}
                >
                  <div className={styles.pdfIconWrapper}>
                    <FaFile size={14} />
                  </div>
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionTitle}>
                      {pdf.title || pdf.filename.replace('.pdf', '')}
                    </div>
                    <div className={styles.sessionMeta}>
                      {pdfSession 
                        ? `${pdfSession.messageCount || 0} msgs • ${formatDate(pdfSession.lastMessageAt)}`
                        : 'Click to start chat'}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>

    {/* Delete Confirmation Modal */}
    {deleteModalOpen && (
      <div className={styles.modalOverlay} onClick={cancelDelete}>
        <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.warningIcon}>
              <FaExclamationTriangle size={24} />
            </div>
            <h3 className={styles.modalTitle}>Delete Chat?</h3>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.modalText}>
              Are you sure you want to delete <strong>"{sessionToDelete?.title}"</strong>?
            </p>
            <p className={styles.modalSubtext}>
              This action cannot be undone. All messages in this chat will be permanently deleted.
            </p>
          </div>
          <div className={styles.modalActions}>
            <button 
              className={styles.cancelBtn}
              onClick={cancelDelete}
            >
              Cancel
            </button>
            <button 
              className={styles.deleteBtn}
              onClick={confirmDelete}
            >
              <FaTrash size={14} />
              Delete Chat
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
