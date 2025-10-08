import React from 'react'
import styles from './PDFInsights.module.css'

export default function PDFInsights({ insights, summary }) {
  if (!insights || insights.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>📖 PDF Insights</h2>
          <p className={styles.subtitle}>Study habits and engagement metrics</p>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h3>No PDF data yet</h3>
          <p>Upload and study from PDFs to see insights here</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📖 PDF Insights</h2>
        <p className={styles.subtitle}>Study habits and engagement metrics</p>
      </div>

      {summary && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>🧠</div>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th align="left">PDF Name</th>
              <th align="center">Total Reads</th>
              <th align="center">Time Spent</th>
              <th align="center">Avg Score</th>
              <th align="center">Accuracy</th>
              <th align="right">Last Accessed</th>
            </tr>
          </thead>
          <tbody>
            {insights.map((pdf, idx) => (
              <tr key={idx} className={styles.row}>
                <td className={styles.pdfName}>
                  <div className={styles.pdfIcon}>📄</div>
                  <span>{pdf.pdfName}</span>
                </td>
                <td align="center">
                  <span className={styles.badge}>{pdf.totalReads}</span>
                </td>
                <td align="center">
                  <span className={styles.timeSpent}>{pdf.timeSpent}</span>
                </td>
                <td align="center">
                  <span className={styles.score}>
                    {pdf.avgScore}
                  </span>
                </td>
                <td align="center">
                  <div className={styles.accuracyBar}>
                    <div 
                      className={styles.accuracyFill}
                      style={{ 
                        width: pdf.accuracy,
                        background: parseFloat(pdf.accuracy) >= 80 
                          ? '#10b981' 
                          : parseFloat(pdf.accuracy) >= 60 
                          ? '#f59e0b' 
                          : '#ef4444'
                      }}
                    />
                  </div>
                  <span className={styles.accuracyText}>{pdf.accuracy}</span>
                </td>
                <td align="right">
                  <span className={styles.lastAccessed}>{pdf.lastAccessed}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className={styles.cardsView}>
        {insights.map((pdf, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.pdfIcon}>📄</div>
              <h3 className={styles.cardTitle}>{pdf.pdfName}</h3>
            </div>
            <div className={styles.cardGrid}>
              <div className={styles.cardStat}>
                <span className={styles.cardLabel}>Total Reads</span>
                <span className={styles.cardValue}>{pdf.totalReads}</span>
              </div>
              <div className={styles.cardStat}>
                <span className={styles.cardLabel}>Time Spent</span>
                <span className={styles.cardValue}>{pdf.timeSpent}</span>
              </div>
              <div className={styles.cardStat}>
                <span className={styles.cardLabel}>Avg Score</span>
                <span className={styles.cardValue}>{pdf.avgScore}</span>
              </div>
              <div className={styles.cardStat}>
                <span className={styles.cardLabel}>Accuracy</span>
                <span className={styles.cardValue}>{pdf.accuracy}</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.lastAccessed}>
                Last accessed: {pdf.lastAccessed}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
