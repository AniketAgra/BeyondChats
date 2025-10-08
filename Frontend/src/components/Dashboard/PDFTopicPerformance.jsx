import React, { useEffect, useState } from 'react'
import styles from './PDFTopicPerformance.module.css'

export default function PDFTopicPerformance({ pdfId }) {
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState(null)
  const [performance, setPerformance] = useState(null)

  useEffect(() => {
    if (pdfId) {
      loadTopicData()
    }
  }, [pdfId])

  const loadTopicData = async () => {
    try {
      setLoading(true)
      
      // Load topics and performance
      const [topicsRes, perfRes] = await Promise.all([
        fetch(`/api/topics/${pdfId}`, {
          credentials: 'include'
        }).then(r => r.json()),
        fetch(`/api/topics/performance/${pdfId}`, {
          credentials: 'include'
        }).then(r => r.json())
      ])

      setTopics(topicsRes)
      setPerformance(perfRes)
    } catch (e) {
      console.error('Failed to load topic data:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    )
  }

  if (!topics || topics.status === 'not_found' || !topics.subtopics || topics.subtopics.length === 0) {
    return null
  }

  const hasPerformance = performance && (
    performance.weakTopics.length > 0 || 
    performance.strongTopics.length > 0 || 
    performance.moderateTopics.length > 0
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>📚 {topics.mainTopic || 'Topics'}</h3>
          <p className={styles.subtitle}>
            {hasPerformance 
              ? 'Your performance across different topics' 
              : 'Topics covered in this material'}
          </p>
        </div>
      </div>

      {hasPerformance ? (
        <div className={styles.performanceGrid}>
          {/* Weak Topics */}
          {performance.weakTopics.length > 0 && (
            <div className={styles.topicGroup}>
              <div className={styles.groupHeader} data-type="weak">
                <span className={styles.icon}>⚠️</span>
                <span className={styles.groupTitle}>Needs Practice</span>
              </div>
              <div className={styles.topicsList}>
                {performance.weakTopics.map((topic, idx) => (
                  <div key={idx} className={styles.topicItem} data-category="weak">
                    <div className={styles.topicInfo}>
                      <span className={styles.topicName}>{topic.topic}</span>
                      <span className={styles.topicStats}>
                        {topic.correctAnswers}/{topic.totalQuestions} correct
                      </span>
                    </div>
                    <div className={styles.accuracyBadge} data-category="weak">
                      {topic.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Moderate Topics */}
          {performance.moderateTopics.length > 0 && (
            <div className={styles.topicGroup}>
              <div className={styles.groupHeader} data-type="moderate">
                <span className={styles.icon}>📈</span>
                <span className={styles.groupTitle}>Improving</span>
              </div>
              <div className={styles.topicsList}>
                {performance.moderateTopics.map((topic, idx) => (
                  <div key={idx} className={styles.topicItem} data-category="moderate">
                    <div className={styles.topicInfo}>
                      <span className={styles.topicName}>{topic.topic}</span>
                      <span className={styles.topicStats}>
                        {topic.correctAnswers}/{topic.totalQuestions} correct
                      </span>
                    </div>
                    <div className={styles.accuracyBadge} data-category="moderate">
                      {topic.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong Topics */}
          {performance.strongTopics.length > 0 && (
            <div className={styles.topicGroup}>
              <div className={styles.groupHeader} data-type="strong">
                <span className={styles.icon}>✅</span>
                <span className={styles.groupTitle}>Mastered</span>
              </div>
              <div className={styles.topicsList}>
                {performance.strongTopics.map((topic, idx) => (
                  <div key={idx} className={styles.topicItem} data-category="strong">
                    <div className={styles.topicInfo}>
                      <span className={styles.topicName}>{topic.topic}</span>
                      <span className={styles.topicStats}>
                        {topic.correctAnswers}/{topic.totalQuestions} correct
                      </span>
                    </div>
                    <div className={styles.accuracyBadge} data-category="strong">
                      {topic.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.topicsChips}>
          {topics.subtopics.map((topic, idx) => (
            <div key={idx} className={styles.topicChip}>
              {topic}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
