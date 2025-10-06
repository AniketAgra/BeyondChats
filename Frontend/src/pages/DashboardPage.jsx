import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsApi } from '../utils/api.js'

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
    <div className="container">
      <h1>Your Learning Journey</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="var(--accent-strong)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3>Quick Actions</h3>
          <button className="btn" style={{ width: '100%', marginBottom: 8 }}>Practice Weak Topics</button>
          <button className="btn secondary" style={{ width: '100%' }}>Generate Custom Quiz</button>
        </div>
      </div>
      <div className="card" style={{ padding: 16, marginTop: 24 }}>
        <h3>Recent Quizzes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th align="left">Date</th><th align="left">Score</th><th align="left">Topic</th></tr></thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td>2025-10-0{i+1}</td>
                <td>{70 + i * 5}%</td>
                <td>Sample Topic</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
