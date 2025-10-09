import React from 'react'
import styles from './OverviewCards.module.css'

export default function OverviewCards({ data }) {
  if (!data) return null

  const { overview, topPdf, topTopics, weakTopics } = data
  const learningLevel = overview.learningLevel

  const mainCards = [
    {
      title: 'Total Study Hours',
      value: overview.totalStudyHours,
      unit: 'hours',
      icon: '🕓',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: `${overview.totalQuizzes} quizzes completed`
    },
    {
      title: 'Average Score',
      value: overview.averageScore,
      unit: '%',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: `From ${overview.totalQuizzes} quizzes`
    },
    {
      title: 'Study Streak',
      value: overview.streak,
      unit: 'days',
      icon: '🔥',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      description: overview.streak > 0 ? 'Keep it up! - Quiz Daily!!' : 'Start today!'
    },
    {
      title: 'Top Coursebook',
      value: topPdf?.title || 'No data yet',
      subtitle: topPdf ? `${topPdf.attempts} attempts • ${topPdf.avgScore}% avg` : 'Start studying!',
      icon: '📚',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      compact: true
    }
  ]

  return (
    <div className={styles.container}>
      {/* Main Stats Grid */}
      <div className={styles.mainGrid}>
        {mainCards.map((card, idx) => (
          <div 
            key={idx} 
            className={`${styles.card} ${card.compact ? styles.compact : ''}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: card.gradient }}>
                <span className={styles.icon}>{card.icon}</span>
              </div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.mainValue}>
                <span className={styles.value}>{card.value}</span>
                {card.unit && <span className={styles.unit}>{card.unit}</span>}
              </div>
              
              {card.subtitle && (
                <p className={styles.subtitle}>{card.subtitle}</p>
              )}
              
              {card.description && (
                <p className={styles.description}>{card.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Learning Level Badge - Prominent Display */}
      <div className={styles.levelBadgeCard}>
        <div className={styles.levelHeader}>
          <h3 className={styles.levelTitle}>Learning Level</h3>
          <span className={styles.levelQuizCount}>{overview.totalQuizzes} quizzes completed</span>
        </div>
        
        <div className={styles.levelBadgeWrapper}>
          <div 
            className={styles.levelBadge}
            style={{ background: learningLevel.gradient }}
          >
            <div className={styles.badgeIcon}>{learningLevel.icon}</div>
            <div className={styles.badgeContent}>
              <div className={styles.badgeName}>{learningLevel.level}</div>
              <div className={styles.badgeTier}>Tier {learningLevel.tier}</div>
            </div>
          </div>
          <p className={styles.levelDescription}>{learningLevel.description}</p>
        </div>
        
        <div className={styles.levelProgress}>
          <div className={styles.progressInfo}>
            <span className={styles.progressLabel}>Progress to next level</span>
            <span className={styles.progressValue}>
              {overview.totalQuizzes % 10} / 10 quizzes
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${(overview.totalQuizzes % 10) * 10}%`,
                background: learningLevel.gradient
              }}
            />
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className={styles.topicsGrid}>
        {/* Top Topics */}
        <div className={styles.topicCard}>
          <div className={styles.topicHeader}>
            <div className={styles.topicIconWrapper}>
              <span className={styles.topicIcon}>🧩</span>
            </div>
            <h3 className={styles.topicTitle}>Top Topics</h3>
          </div>
          
          {topTopics.length > 0 ? (
            <div className={styles.topicList}>
              {topTopics.slice(0, 3).map((topic, idx) => (
                <div key={idx} className={styles.topicItem}>
                  <div className={styles.topicRank}>{idx + 1}</div>
                  <div className={styles.topicInfo}>
                    <span className={styles.topicName}>{topic.topic}</span>
                    <span className={styles.topicMeta}>{topic.attempts} attempts</span>
                  </div>
                  <div className={styles.topicScore}>
                    <span className={styles.scoreValue}>{topic.avgScore}%</span>
                    <div className={styles.scoreBadge} style={{ background: '#10b981' }}>
                      Strong
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyTopics}>Complete quizzes to see your top topics</p>
          )}
        </div>

        {/* Weak Topics */}
        <div className={`${styles.topicCard} ${weakTopics.length > 0 ? styles.weakCard : ''}`}>
          <div className={styles.topicHeader}>
            <div className={styles.topicIconWrapper}>
              <span className={styles.topicIcon}>⚡</span>
            </div>
            <h3 className={styles.topicTitle}>Topics to Practice</h3>
          </div>
          
          {weakTopics.length > 0 ? (
            <div className={styles.topicList}>
              {weakTopics.slice(0, 3).map((topic, idx) => (
                <div key={idx} className={styles.topicItem}>
                  <div className={`${styles.topicRank} ${styles.weakRank}`}>!</div>
                  <div className={styles.topicInfo}>
                    <span className={styles.topicName}>{topic.topic}</span>
                    <span className={styles.topicMeta}>{topic.attempts} attempts</span>
                  </div>
                  <div className={styles.topicScore}>
                    <span className={styles.scoreValue}>{topic.avgScore}%</span>
                    <div className={styles.scoreBadge} style={{ background: '#ef4444' }}>
                      Practice
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.strongPerformance}>
              <div className={styles.strongIcon}>💪</div>
              <p className={styles.strongText}>All topics are strong!</p>
              <p className={styles.strongSubtext}>Keep up the excellent work</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
