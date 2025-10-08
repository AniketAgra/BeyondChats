import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import styles from './AIBuddyPage.module.css'
import { aiBuddyApi } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { FaBrain, FaPaperPlane, FaBookOpen, FaBullseye, FaChartLine, FaStar, FaBars } from 'react-icons/fa'
import ChatSidebar from '../components/ChatSidebar/ChatSidebar.jsx'

export default function AIBuddyPage() {
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('topic')
  const { user } = useAuth()
  
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Suggested prompts
  const suggestedPrompts = [
    { icon: <FaBookOpen size={20} />, text: "Explain this topic in simple terms", category: "Explain" },
    { icon: <FaBullseye size={20} />, text: "What are my weak topics?", category: "Performance" },
    { icon: <FaChartLine size={20} />, text: "Create a study plan for me", category: "Study Plan" },
    { icon: <FaStar size={20} />, text: "Quiz me on this subject", category: "Quiz" }
  ]

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId)
    }
  }, [activeSessionId])

  // If topic is provided via URL, create a new chat and ask about it
  useEffect(() => {
    if (topic && sessions.length > 0 && !activeSessionId && !isLoading) {
      handleCreateSessionWithTopic(topic)
    }
  }, [topic, sessions])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSessions = async () => {
    try {
      const response = await aiBuddyApi.getSessions()
      setSessions(response.sessions || [])
      
      // If no active session and sessions exist, select the first one
      if (!activeSessionId && response.sessions && response.sessions.length > 0) {
        setActiveSessionId(response.sessions[0]._id)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsInitialLoad(false)
    }
  }

  const loadMessages = async (sessionId) => {
    try {
      setIsLoading(true)
      const response = await aiBuddyApi.getMessages(sessionId)
      setMessages(response.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSession = async (type) => {
    try {
      const response = await aiBuddyApi.createSession(type)
      setSessions(prev => [response.session, ...prev])
      setActiveSessionId(response.session._id)
      setMessages([])
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleCreateSessionWithTopic = async (topicName) => {
    try {
      const response = await aiBuddyApi.createSession('general', null, `Learn: ${topicName}`)
      setSessions(prev => [response.session, ...prev])
      setActiveSessionId(response.session._id)
      setMessages([])
      
      // Auto-send topic query
      setTimeout(() => {
        const query = `Help me understand and improve on: ${topicName}`
        handleSend(query)
      }, 500)
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleSend = async (textToSend = null) => {
    const messageText = textToSend || input.trim()
    if (!messageText || isLoading || !activeSessionId) return

    // Add user message immediately (optimistic update)
    const userMessage = {
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await aiBuddyApi.sendMessage(activeSessionId, messageText, true)

      // Replace optimistic message with server response
      if (response.messages && response.messages.length > 0) {
        const [serverUserMsg, serverAiMsg] = response.messages
        setMessages(prev => {
          // Remove optimistic message and add server messages
          const withoutOptimistic = prev.slice(0, -1)
          return [...withoutOptimistic, serverUserMsg, serverAiMsg]
        })
        
        // Update session's last message time
        setSessions(prev => prev.map(s => 
          s._id === activeSessionId 
            ? { ...s, lastMessageAt: new Date().toISOString(), messageCount: s.messageCount + 2 }
            : s
        ))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Add error message
      const errorMessage = {
        role: 'ai',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId)
  }

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this chat?')) return
    
    try {
      await aiBuddyApi.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s._id !== sessionId))
      
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s._id !== sessionId)
        setActiveSessionId(remaining.length > 0 ? remaining[0]._id : null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await aiBuddyApi.updateSession(sessionId, newTitle)
      setSessions(prev => prev.map(s => 
        s._id === sessionId ? { ...s, title: newTitle } : s
      ))
    } catch (error) {
      console.error('Failed to rename session:', error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestedPrompt = (promptText) => {
    setInput(promptText)
    inputRef.current?.focus()
  }

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    let formatted = content
    
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code blocks
    formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    
    // Inline code
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>')
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>')
    
    return formatted
  }

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      {sidebarOpen && (
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
        />
      )}

      <div className={styles.chatContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <button 
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars size={20} />
            </button>
            <div className={styles.logoSection}>
              <div className={styles.logoIcon}>
                <FaBrain size={28} />
              </div>
              <div>
                <h1 className={styles.title}>AI Study Buddy</h1>
                <p className={styles.subtitle}>
                  {activeSessionId 
                    ? sessions.find(s => s._id === activeSessionId)?.title || 'Chat'
                    : 'Your personalized AI learning mentor'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className={styles.messagesContainer}>
          {isInitialLoad ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <FaStar size={48} />
              </div>
              <h2 className={styles.emptyTitle}>Welcome to AI Study Buddy!</h2>
              <p className={styles.emptyText}>
                I'm your personalized AI tutor, trained on your PDFs, notes, and quiz performance. 
                Ask me anything about your study materials or request detailed explanations!
              </p>
              
              <div className={styles.suggestedPrompts}>
                <p className={styles.promptsLabel}>Try asking:</p>
                <div className={styles.promptsGrid}>
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      className={styles.promptCard}
                      onClick={() => handleSuggestedPrompt(prompt.text)}
                    >
                      <div className={styles.promptIcon}>{prompt.icon}</div>
                      <span className={styles.promptText}>{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.messagesList}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.messageWrapper} ${
                    msg.role === 'user' ? styles.userMessage : styles.aiMessage
                  }`}
                >
                  <div className={styles.messageContent}>
                    {msg.role === 'ai' && (
                      <div className={styles.aiAvatar}>
                        <FaBrain size={20} />
                      </div>
                    )}
                    <div className={styles.messageBubble}>
                      <div 
                        className={styles.messageText}
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                    </div>
                    {msg.role === 'user' && (
                      <div className={styles.userAvatar}>
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className={`${styles.messageWrapper} ${styles.aiMessage}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.aiAvatar}>
                      <FaBrain size={20} />
                    </div>
                    <div className={styles.messageBubble}>
                      <div className={styles.typingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your study materials..."
              className={styles.input}
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={styles.sendButton}
            >
              <FaPaperPlane size={20} />
            </button>
          </div>
          <p className={styles.inputHint}>
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
