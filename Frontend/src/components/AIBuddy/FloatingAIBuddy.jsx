import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './FloatingAIBuddy.module.css'

export default function FloatingAIBuddy() {
  const navigate = useNavigate()
  return (
    <button
      className={styles.fab}
      aria-label="Open AI Buddy"
      title="AI Buddy"
      onClick={() => navigate('/aibuddy')}
    >
      <BotIcon className={styles.icon} />
    </button>
  )
}

function BotIcon({ className }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="8" width="18" height="11" rx="6" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
      <path d="M7 18c1.2 1 3 1.5 5 1.5s3.8-.5 5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
