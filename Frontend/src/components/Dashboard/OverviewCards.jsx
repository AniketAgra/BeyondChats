import React from 'react'
import styles from './OverviewCards.module.css'

export default function OverviewCards({ data }) {
  if (!data) return null

  const { overview, topPdf, topTopics, weakTopics } = data

  const cards = [
    {
      title: 'Total Study Hours',
      value: overview.totalStudyHours,
      unit: 'hours',
      icon: '🕓',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: `${overview.totalQuizzes} quizzes completed`
    },
    {
      title: 'Top Coursebook',
      value: topPdf?.title || 'No data yet',
      subtitle: topPdf ? `${topPdf.attempts} attempts • ${topPdf.avgScore}% avg` : 'Start studying!',
      icon: '📚',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      compact: true
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
      description: overview.streak > 0 ? 'Keep it up!' : 'Start today!'
    },
    {
      title: 'Learning Level',
      value: overview.learningLevel.level,
      icon: overview.learningLevel.icon,
      gradient: `linear-gradient(135deg, ${overview.learningLevel.color} 0%, ${overview.learningLevel.color}dd 100%)`,
      description: `Based on ${overview.totalQuizzes} quizzes`,
      badge: true
    },
    {
      title: 'Top Topics',
      value: topTopics.length > 0 ? topTopics[0].topic : 'No data',
      subtitle: topTopics.length > 0 ? `${topTopics[0].avgScore}% mastery` : 'Complete quizzes first',
      icon: '🧩',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      list: topTopics.slice(1, 3).map(t => `${t.topic} (${t.avgScore}%)`),
      compact: true
    },
    {
      title: 'Weak Topics',
      value: weakTopics.length > 0 ? weakTopics[0].topic : 'None found',
      subtitle: weakTopics.length > 0 ? `${weakTopics[0].avgScore}% - needs practice` : 'All topics strong! 💪',
      icon: '⚡',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      list: weakTopics.slice(1, 3).map(t => `${t.topic} (${t.avgScore}%)`),
      compact: true,
      alert: weakTopics.length > 0
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            className={`${styles.card} ${card.compact ? styles.compact : ''} ${card.alert ? styles.alert : ''}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: card.gradient }}>
                <span className={styles.icon}>{card.icon}</span>
              </div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.mainValue}>
                {card.badge ? (
                  <span className={styles.badge}>{card.value}</span>
                ) : (
                  <>
                    <span className={styles.value}>{card.value}</span>
                    {card.unit && <span className={styles.unit}>{card.unit}</span>}
                  </>
                )}
              </div>
              
              {card.subtitle && (
                <p className={styles.subtitle}>{card.subtitle}</p>
              )}
              
              {card.description && (
                <p className={styles.description}>{card.description}</p>
              )}
              
              {card.list && card.list.length > 0 && (
                <ul className={styles.list}>
                  {card.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
