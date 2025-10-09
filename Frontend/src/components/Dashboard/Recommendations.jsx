import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Recommendations.module.css'
import { ytApi } from '../../utils/api.js'

export default function Recommendations({ recommendations, weakTopics, weakTopicsData }) {
  const navigate = useNavigate()
  const [loadingVideos, setLoadingVideos] = useState(false)

  const handleAction = async (rec) => {
    switch(rec.type) {
      case 'practice':
        // If there's a weakest topic with PDF, navigate to quiz page for that PDF
        if (rec.weakestTopic && rec.weakestTopic.pdfId) {
          navigate(`/quiz?pdfId=${rec.weakestTopic.pdfId}`)
        } else {
          navigate('/library')
        }
        break
      case 'revise':
        navigate('/library')
        break
      case 'custom':
        navigate('/quiz')
        break
      case 'video':
        // Navigate to AI buddy with the weakest topic as query param
        if (weakTopicsData && weakTopicsData.length > 0) {
          const weakestTopic = weakTopicsData[0].topic
          navigate(`/aibuddy?topic=${encodeURIComponent(weakestTopic)}`)
        } else {
          navigate('/aibuddy')
        }
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

      {weakTopicsData && weakTopicsData.length > 0 && (
        <div className={styles.weakTopicsAlert}>
          <div className={styles.alertIcon}>⚠️</div>
          <div className={styles.alertContent}>
            <h4 className={styles.alertTitle}>Topics Needing Practice</h4>
            <div className={styles.topicsList}>
              {weakTopicsData.map((topicData, idx) => (
                <div 
                  key={idx} 
                  className={styles.topicItem}
                  onClick={() => {
                    if (topicData.pdfId) {
                      navigate(`/quiz?pdfId=${topicData.pdfId}`)
                    }
                  }}
                  style={{ cursor: topicData.pdfId ? 'pointer' : 'default' }}
                >
                  <div className={styles.topicInfo}>
                    <span className={styles.topicName}>{topicData.topic}</span>
                    {topicData.pdfTitle && (
                      <span className={styles.pdfName}>📄 {topicData.pdfTitle}</span>
                    )}
                  </div>
                  <div className={styles.topicStats}>
                    <span className={styles.accuracy}>{Math.round(topicData.avgScore)}%</span>
                    <span className={styles.attempts}>{topicData.attempts} attempts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
