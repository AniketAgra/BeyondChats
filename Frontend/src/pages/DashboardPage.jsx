import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsApi } from '../utils/api.js'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const [data, setData] = useState([])
  useEffect(() => { (async () => {
    try {
      const { recent } = await analyticsApi.overview()
      const d = (recent || []).map((r) => ({ name: new Date(r.date).toLocaleDateString(), score: r.score }))
      setData(d)
    } catch (e) { /* ignore */ }
  })() }, [])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Learning Journey</h1>
      <div className={styles.grid}>
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Performance Overview</h2>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--muted)" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--card)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)'
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--accent-strong)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={styles.actionsCard}>
          <h3 className={styles.cardTitle}>Quick Actions</h3>
          <button className={styles.actionBtn}>Practice Weak Topics</button>
          <button className={`${styles.actionBtn} ${styles.secondary}`}>Generate Custom Quiz</button>
        </div>
      </div>
      <div className={styles.tableCard}>
        <h3 className={styles.cardTitle}>Recent Quizzes</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th align="left">Date</th>
                <th align="left">Score</th>
                <th align="left">Topic</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>2025-10-0{i+1}</td>
                  <td><span className={styles.score}>{70 + i * 5}%</span></td>
                  <td>Sample Topic</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
