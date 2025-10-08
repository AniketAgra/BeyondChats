import React from 'react'
import styles from './TopicInsights.module.css'

export default function TopicInsights({ topicInsights }) {
  if (!topicInsights) return null

  const { overallWeakTopics = [], overallStrongTopics = [] } = topicInsights

  const hasTopics = overallWeakTopics.length > 0 || overallStrongTopics.length > 0

  if (!hasTopics) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>📚 Topic Performance</h2>
          <p className={styles.subtitle}>Complete more quizzes to track your topic mastery</p>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📊</span>
          <p>No topic data available yet. Start taking quizzes to see your performance!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📚 Topic Performance</h2>
        <p className={styles.subtitle}>Identify your strong and weak topics across all materials</p>
      </div>

      <div className={styles.topicsGrid}>
        {/* Weak Topics Section */}
        {overallWeakTopics.length > 0 && (
          <div className={styles.topicSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.icon}>⚠️</span>
              <h3 className={styles.sectionTitle}>Needs Improvement</h3>
              <span className={styles.badge} data-type="weak">{overallWeakTopics.length}</span>
            </div>
            <div className={styles.topicList}>
              {overallWeakTopics.map((topic, idx) => (
                <div key={idx} className={styles.topicCard} data-category="weak">
                  <div className={styles.topicHeader}>
                    <div className={styles.topicName}>{topic.topic}</div>
                    <div className={styles.accuracy} data-category="weak">
                      {topic.accuracy}%
                    </div>
                  </div>
                  <div className={styles.topicDetails}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        data-category="weak"
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>
                    <div className={styles.stats}>
                      <span className={styles.stat}>
                        {topic.totalQuestions} questions
                      </span>
                      {topic.pdfs && topic.pdfs.length > 0 && (
                        <span className={styles.pdfCount}>
                          {topic.pdfs.length} PDF{topic.pdfs.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {topic.pdfs && topic.pdfs.length > 0 && (
                    <div className={styles.pdfTags}>
                      {topic.pdfs.slice(0, 2).map((pdf, i) => (
                        <span key={i} className={styles.pdfTag}>{pdf}</span>
                      ))}
                      {topic.pdfs.length > 2 && (
                        <span className={styles.pdfTag}>+{topic.pdfs.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong Topics Section */}
        {overallStrongTopics.length > 0 && (
          <div className={styles.topicSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.icon}>✅</span>
              <h3 className={styles.sectionTitle}>Mastered Topics</h3>
              <span className={styles.badge} data-type="strong">{overallStrongTopics.length}</span>
            </div>
            <div className={styles.topicList}>
              {overallStrongTopics.map((topic, idx) => (
                <div key={idx} className={styles.topicCard} data-category="strong">
                  <div className={styles.topicHeader}>
                    <div className={styles.topicName}>{topic.topic}</div>
                    <div className={styles.accuracy} data-category="strong">
                      {topic.accuracy}%
                    </div>
                  </div>
                  <div className={styles.topicDetails}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        data-category="strong"
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>
                    <div className={styles.stats}>
                      <span className={styles.stat}>
                        {topic.totalQuestions} questions
                      </span>
                      {topic.pdfs && topic.pdfs.length > 0 && (
                        <span className={styles.pdfCount}>
                          {topic.pdfs.length} PDF{topic.pdfs.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {topic.pdfs && topic.pdfs.length > 0 && (
                    <div className={styles.pdfTags}>
                      {topic.pdfs.slice(0, 2).map((pdf, i) => (
                        <span key={i} className={styles.pdfTag}>{pdf}</span>
                      ))}
                      {topic.pdfs.length > 2 && (
                        <span className={styles.pdfTag}>+{topic.pdfs.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
