import React, { useState } from 'react'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts'
import styles from './LearningAnalytics.module.css'

export default function LearningAnalytics({ performanceTrend, topicMastery, timeSpent }) {
  // Local UI state for hover effects on bar chart
  const [hoveredBar, setHoveredBar] = useState(null)

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          <p className={styles.tooltipValue}>
            {`${payload[0].name?.charAt(0).toUpperCase()}${payload[0].name?.slice(1)}`}: <strong>{payload[0].value}</strong>
            {payload[0].name === 'minutes' ? ' min' : (payload[0].unit || '')}
          </p>
        </div>
      )
    }
    return null
  }

  // More polished tooltip specifically for Time Spent (purple accent and nicer copy)
  const TimeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          <p className={styles.tooltipValue}>
            Minutes: <strong style={{ color: '#a78bfa' }}>{value}</strong>
          </p>
        </div>
      )
    }
    return null
  }

  // Colors for heatmap
  const getHeatmapColor = (level) => {
    switch(level) {
      case 'strong': return '#10b981'
      case 'moderate': return '#f59e0b'
      case 'weak': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>📊 Learning Analytics</h2>
        <p className={styles.sectionSubtitle}>Visual insights from your study data</p>
      </div>

      <div className={styles.chartsGrid}>
        {/* Performance Trend Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Performance Trend</h3>
            <span className={styles.chartBadge}>Last 10 Quizzes</span>
          </div>
          <p className={styles.chartDescription}>
            Track your quiz scores over time to see improvement patterns
          </p>
          <div className={styles.chartWrapper}>
            {performanceTrend && performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--muted)" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="var(--muted)" 
                    style={{ fontSize: '12px' }}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#14b8a6" 
                    strokeWidth={3}
                    dot={{ fill: '#14b8a6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>
                <p>No performance data yet. Complete some quizzes to see trends!</p>
              </div>
            )}
          </div>
        </div>

        {/* Topic Mastery Heatmap */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Topic Mastery</h3>
            <span className={styles.chartBadge}>By Accuracy</span>
          </div>
          <p className={styles.chartDescription}>
            Color-coded topics: <span className={styles.strong}>Green = Strong</span>, 
            <span className={styles.moderate}> Yellow = Moderate</span>, 
            <span className={styles.weak}> Red = Weak</span>
          </p>
          <div className={styles.heatmapWrapper}>
            {topicMastery && topicMastery.length > 0 ? (
              <div className={styles.heatmap}>
                {topicMastery.map((topic, idx) => (
                  <div 
                    key={idx} 
                    className={styles.heatmapItem}
                    style={{ 
                      background: `linear-gradient(135deg, ${getHeatmapColor(topic.level)}15, ${getHeatmapColor(topic.level)}30)`,
                      borderLeft: `4px solid ${getHeatmapColor(topic.level)}`
                    }}
                  >
                    <div className={styles.heatmapTopic}>{topic.topic}</div>
                    <div className={styles.heatmapStats}>
                      <span className={styles.heatmapScore}>{topic.avgScore}%</span>
                      <span className={styles.heatmapAttempts}>{topic.attempts} attempts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No topic data yet. Complete quizzes to see mastery levels!</p>
              </div>
            )}
          </div>
        </div>

        {/* Time Spent Bar Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Time Spent</h3>
            <span className={styles.chartBadge}>Last 7 Days</span>
          </div>
          <p className={styles.chartDescription}>
            Daily learning time helps visualize consistency and habits
          </p>
          <div className={styles.chartWrapper}>
            {timeSpent && timeSpent.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSpent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--muted)" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="var(--muted)" 
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={<TimeTooltip />} 
                    cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }} 
                  />
                  <Bar 
                    dataKey="minutes" 
                    radius={[8, 8, 0, 0]}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {timeSpent.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        onMouseEnter={() => setHoveredBar(index)}
                        fill={hoveredBar === index ? '#a78bfa' : '#8b5cf6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>
                <p>No time tracking data yet. Start studying to see insights!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
