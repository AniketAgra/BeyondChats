import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ChatPanel.module.css'
import { chatApi } from '../../utils/api.js'
import useChatSocket from '../../hooks/useChatSocket.js'

export default function ChatPanel({ pdfId }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const threadRef = useRef(null)
  const streamingIdRef = useRef(null)
  
  // Initialize Socket.io for real-time chat
  const { isConnected, isTyping, streamingMessage, sendMessage, joinPdf, leavePdf, getChatHistory } = useChatSocket()
  
  // Load chat history on mount or when PDF changes
  useEffect(() => { 
    if (!pdfId) return

    // Always try to load chat history first via REST API (reliable and immediate)
    (async () => {
      try {
        const response = await chatApi.getHistory({ pdfId, limit: 50 })
        const items = response.items || []
        
        if (items.length > 0) {
          setMessages(items)
        } else {
          setMessages([{
            role: 'ai',
            content: "Hi there! 👋 I'm your quick AI Buddy here to help with short answers and quick questions!\n\n💡 For quick help, ask me anything!\n🎓 Need detailed explanations? Visit our AI Mentor for in-depth guidance, personalized learning, and comprehensive analysis!",
            _id: 'welcome'
          }])
        }
      } catch (err) {
        console.error('Failed to load chat history:', err)
        setMessages([{
          role: 'ai',
          content: "Hi there! 👋 I'm your quick AI Buddy here to help with short answers and quick questions!\n\n💡 For quick help, ask me anything!\n🎓 Need detailed explanations? Visit our AI Mentor for in-depth guidance, personalized learning, and comprehensive analysis!",
          _id: 'welcome'
        }])
      }
    })()

    // If Socket.io is connected, also join the room for real-time updates
    if (isConnected) {
      joinPdf(pdfId, (stats) => {
        console.log('Memory loaded:', stats)
      })
      
      return () => {
        leavePdf(pdfId)
      }
    }
  }, [pdfId, isConnected])

  // Keep the view pinned to the latest messages
  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, streamingText])

  const send = async () => {
    if (!input.trim()) return
    const userMessage = input.trim()
    setInput('')
    setStreamingText('')
    
    if (isConnected) {
      // Use Socket.io for real-time streaming
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
      
      sendMessage(
        { content: userMessage, pdfId, conversationHistory },
        {
          onUserMessageSaved: (data) => {
            // Add confirmed user message
            setMessages(prev => [...prev, {
              _id: data.messageId,
              role: 'user',
              content: data.content,
              createdAt: data.timestamp
            }])
          },
          onChunk: (chunk) => {
            // Update streaming text as chunks arrive
            setStreamingText(prev => prev + chunk)
          },
          onComplete: (data) => {
            // Add complete AI response
            setMessages(prev => [...prev, {
              _id: data.messageId,
              role: 'ai',
              content: data.content,
              createdAt: data.timestamp
            }])
            setStreamingText('')
            streamingIdRef.current = null
          },
          onError: (data) => {
            // Handle error
            console.error('Chat error:', data)
            if (data.fallback) {
              setMessages(prev => [...prev, {
                _id: Date.now(),
                role: 'ai',
                content: data.fallback,
                createdAt: new Date()
              }])
            }
            setStreamingText('')
            streamingIdRef.current = null
          }
        }
      )
      
      streamingIdRef.current = Date.now()
    } else {
      // Fallback to REST API
      setMessages(prev => [...prev, { role: 'user', content: userMessage, _id: Date.now() }])
      
      try {
        const response = await chatApi.send({ content: userMessage, pdfId })
        // Backend returns { messages: [userMsg, aiMsg] }
        const msgs = response.messages || []
        setMessages(prev => [...prev, ...msgs.filter(m => m.role !== 'user')])
      } catch (e) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: 'Sorry, I\'m having trouble connecting right now. Please try again.', 
          _id: Date.now() + 1 
        }])
      }
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
      <div className={styles.header}>
        <div className={styles.headerIcon}>🤖</div>
        <div className={styles.headerContent}>
          <h3 className={styles.headerTitle}>
            AI Pdf Buddy
            <span className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}></span>
          </h3>
          <p className={styles.headerSubtitle}>
            {isConnected ? 'Connected • Real-time AI Assistant' : 'Connecting...'}
          </p>
        </div>
      </div>
      
      <div className={styles.thread} ref={threadRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>�</div>
            <p className={styles.emptyText}>Your Personal Study Assistant</p>
            <p className={styles.emptySubtext}>Feel free to ask any question in your mind</p>
            <div className={styles.suggestions}>
              <p className={styles.suggestionsTitle}>Try asking:</p>
              <button 
                className={styles.suggestionChip}
                onClick={() => setInput("Can you summarize the key points?")}
              >
                📝 Summarize key points
              </button>
              <button 
                className={styles.suggestionChip}
                onClick={() => setInput("Explain this concept in simple terms")}
              >
                💡 Explain concepts simply
              </button>
              <button 
                className={styles.suggestionChip}
                onClick={() => setInput("What are the main takeaways?")}
              >
                🎯 Main takeaways
              </button>
              <button 
                className={styles.suggestionChip}
                onClick={() => setInput("Help me understand this better")}
              >
                🤔 Need help understanding
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div 
                key={m._id || i} 
                className={`${m.role === 'ai' ? styles.ai : styles.user} ${m.role === 'ai' ? styles.fadeInUp : ''}`}
              >
                {m.role === 'ai' && <div className={styles.aiAvatar}>🤖</div>}
                <div className={styles.messageContent}>
                  {m.content}
                  {m.role === 'ai' && m.content.includes('AI Mentor') && (
                    <button 
                      className={styles.MentorLink}
                      onClick={() => navigate('/aibuddy')}
                    >
                      🎓 Go to AI Mentor
                    </button>
                  )}
                </div>
              </div>
            ))}
            {streamingText && (
              <div className={`${styles.ai} ${styles.streaming}`}>
                <div className={styles.aiAvatar}>🤖</div>
                <div className={styles.messageContent}>
                  {streamingText}
                  <span className={styles.cursor}>|</span>
                </div>
              </div>
            )}
            {isTyping && !streamingText && (
              <div className={styles.ai}>
                <div className={styles.aiAvatar}>🤖</div>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {messages.length > 0 && messages.length < 4 && (
        <div className={styles.quickActions}>
          <button 
            className={styles.quickActionBtn}
            onClick={() => setInput("Can you summarize the key points from this document?")}
            disabled={isTyping}
          >
            📝 Summarize
          </button>
          <button 
            className={styles.quickActionBtn}
            onClick={() => setInput("Explain the main concepts in simple terms")}
            disabled={isTyping}
          >
            💡 Explain
          </button>
          <button 
            className={styles.quickActionBtn}
            onClick={() => setInput("What should I focus on when studying this?")}
            disabled={isTyping}
          >
            🎯 Study Guide
          </button>
        </div>
      )}
      
      <div className={styles.inputRow}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyPress={handleKeyPress}
          placeholder="Feel free to ask anything about this PDF..." 
          className={styles.messageInput}
        />
        <button 
          className={styles.sendButton} 
          onClick={send}
          disabled={!input.trim() || isTyping}
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
