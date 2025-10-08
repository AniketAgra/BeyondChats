import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './RecentActivity.module.css'

export default function RecentActivity({ activities }) {
  const navigate = useNavigate()

  if (!activities || activities.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>📈 Recent Activity</h2>
          <p className={styles.subtitle}>Last 10 quiz attempts</p>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3>No quiz attempts yet</h3>
          <p>Start taking quizzes to track your progress here</p>
          <button 
            className={styles.startButton}
            onClick={() => navigate('/quiz')}
          >
            Take Your First Quiz
          </button>
        </div>
      </div>
    )
  }

  const getScoreColor = (accuracy) => {
    if (accuracy >= 80) return styles.excellent
    if (accuracy >= 60) return styles.good
    return styles.needsWork
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📈 Recent Activity</h2>
        <button 
          className={styles.viewAllButton}
          onClick={() => navigate('/quizzes-history')}
        >
          View All Attempts →
        </button>
      </div>

      {/* Desktop Table View */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th align="left">Date</th>
              <th align="left">Topic</th>
              <th align="center">Type</th>
              <th align="center">Score</th>
              <th align="center">Accuracy</th>
              <th align="right">Time Taken</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, idx) => (
              <tr key={idx} className={styles.row}>
                <td>
                  <span className={styles.date}>{activity.date}</span>
                </td>
                <td>
                  <span className={styles.topic}>{activity.topic}</span>
                </td>
                <td align="center">
                  <span className={styles.typeBadge}>{activity.type}</span>
                </td>
                <td align="center">
                  <span className={styles.score}>{activity.score}</span>
                </td>
                <td align="center">
                  <div className={styles.accuracyWrapper}>
                    <div className={styles.progressBar}>
                      <div 
                        className={`${styles.progressFill} ${getScoreColor(activity.accuracy)}`}
                        style={{ width: `${activity.accuracy}%` }}
                      />
                    </div>
                    <span className={styles.accuracyText}>
                      {activity.accuracy}%
                    </span>
                  </div>
                </td>
                <td align="right">
                  <span className={styles.time}>{activity.timeTaken}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className={styles.cardsView}>
        {activities.map((activity, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardDate}>{activity.date}</span>
              <span className={styles.typeBadge}>{activity.type}</span>
            </div>
            <h3 className={styles.cardTopic}>{activity.topic}</h3>
            <div className={styles.cardStats}>
              <div className={styles.cardStat}>
                <span className={styles.cardLabel}>Score</span>
                <span className={styles.cardValue}>{activity.score}</span>
              </div>
              <div className={styles.cardStat}>
                <span className={styles.cardLabel}>Accuracy</span>
                <span className={`${styles.cardValue} ${getScoreColor(activity.accuracy)}`}>
                  {activity.accuracy}%
                </span>
              </div>
              <div className={styles.cardStat}>
                <span className={styles.cardLabel}>Time</span>
                <span className={styles.cardValue}>{activity.timeTaken}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
