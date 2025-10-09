import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'

/**
 * Custom hook for real-time chat with Socket.io
 * Provides ChatGPT-like streaming experience
 */
export function useChatSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const socketRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get auth token
    const token = localStorage.getItem('token')
    if (!token) {
      setError('No authentication token found')
      return
    }

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket.io connection error:', err.message)
      setError(err.message)
      setIsConnected(false)
    })

    // Clean up on unmount
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const joinPdf = (pdfId, onMemoryLoaded) => {
    if (socketRef.current && pdfId) {
      // Listen for memory loaded confirmation
      if (onMemoryLoaded) {
        const handler = (stats) => {
          onMemoryLoaded(stats)
          socketRef.current.off('memory-loaded', handler)
        }
        socketRef.current.on('memory-loaded', handler)
      }
      
      socketRef.current.emit('join-pdf', { pdfId })
    }
  }

  const leavePdf = (pdfId) => {
    if (socketRef.current && pdfId) {
      socketRef.current.emit('leave-pdf', { pdfId })
    }
  }

  const sendMessage = ({ content, pdfId, conversationHistory = [] }, callbacks = {}) => {
    if (!socketRef.current) {
      callbacks.onError?.({ error: 'Socket not connected' })
      return
    }

    setStreamingMessage('')
    setError(null)

    // Listen for message saved confirmation
    const onMessageSaved = (data) => {
      callbacks.onUserMessageSaved?.(data)
    }

    // Listen for AI typing indicator
    const onAiTyping = (data) => {
      setIsTyping(data.isTyping)
      callbacks.onTyping?.(data.isTyping)
    }

    // Listen for streaming chunks
    const onResponseChunk = (data) => {
      setStreamingMessage(prev => prev + data.chunk)
      callbacks.onChunk?.(data.chunk)
    }

    // Listen for complete response
    const onResponseComplete = (data) => {
      setIsTyping(false)
      setStreamingMessage('')
      callbacks.onComplete?.(data)
      
      // Clean up listeners
      cleanup()
    }

    // Listen for errors
    const onChatError = (data) => {
      setIsTyping(false)
      setStreamingMessage('')
      setError(data.error)
      callbacks.onError?.(data)
      
      // Clean up listeners
      cleanup()
    }

    // Set up listeners
    socketRef.current.on('message-saved', onMessageSaved)
    socketRef.current.on('ai-typing', onAiTyping)
    socketRef.current.on('ai-response-chunk', onResponseChunk)
    socketRef.current.on('ai-response-complete', onResponseComplete)
    socketRef.current.on('chat-error', onChatError)

    // Cleanup function
    const cleanup = () => {
      if (socketRef.current) {
        socketRef.current.off('message-saved', onMessageSaved)
        socketRef.current.off('ai-typing', onAiTyping)
        socketRef.current.off('ai-response-chunk', onResponseChunk)
        socketRef.current.off('ai-response-complete', onResponseComplete)
        socketRef.current.off('chat-error', onChatError)
      }
    }

    // Send the message
    socketRef.current.emit('chat-message', { content, pdfId, conversationHistory })
  }

  const getChatHistory = (pdfId, limit = 50, callback) => {
    if (!socketRef.current) {
      callback?.({ messages: [], error: 'Socket not connected' })
      return
    }

    const onHistory = (data) => {
      callback?.(data)
      socketRef.current.off('chat-history', onHistory)
    }

    const onError = (data) => {
      callback?.({ messages: [], error: data.error })
      socketRef.current.off('chat-error', onError)
    }

    socketRef.current.on('chat-history', onHistory)
    socketRef.current.on('chat-error', onError)
    socketRef.current.emit('get-chat-history', { pdfId, limit })
  }

  return {
    isConnected,
    isTyping,
    streamingMessage,
    error,
    sendMessage,
    joinPdf,
    leavePdf,
    getChatHistory
  }
}

export default useChatSocket
