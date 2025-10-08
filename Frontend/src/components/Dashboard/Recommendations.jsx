import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Recommendations.module.css'

export default function Recommendations({ recommendations, weakTopics }) {
  const navigate = useNavigate()

  const handleAction = (rec) => {
    switch(rec.type) {
      case 'practice':
        navigate('/quiz')
        break
      case 'revise':
        navigate('/library')
        break
      case 'custom':
        navigate('/quiz')
        break
      case 'video':
        navigate('/ai-buddy')
        break
      default:
        break
    }
  }

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🎯 Recommendations & Actions</h2>
        <p className={styles.subtitle}>AI-driven insights for learning improvement</p>
      </div>

      <div className={styles.grid}>
        {recommendations.map((rec) => (
          <div 
            key={rec.id} 
            className={`${styles.card} ${rec.type === 'practice' && weakTopics?.length > 0 ? styles.highlight : ''}`}
            onClick={() => handleAction(rec)}
          >
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>{rec.icon}</span>
            </div>
            <div className={styles.content}>
              <h3 className={styles.cardTitle}>{rec.title}</h3>
              <p className={styles.description}>{rec.description}</p>
            </div>
            <button className={styles.actionButton}>
              {rec.action} →
            </button>
          </div>
        ))}
      </div>

      {weakTopics && weakTopics.length > 0 && (
        <div className={styles.weakTopicsAlert}>
          <div className={styles.alertIcon}>⚠️</div>
          <div className={styles.alertContent}>
            <h4 className={styles.alertTitle}>Topics Needing Practice</h4>
            <div className={styles.topicTags}>
              {weakTopics.map((topic, idx) => (
                <span key={idx} className={styles.topicTag}>{topic}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
