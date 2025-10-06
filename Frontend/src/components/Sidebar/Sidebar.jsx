import React from 'react'
import styles from './Sidebar.module.css'

export default function Sidebar({ outline = [], onJump }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>Table of Contents</h3>
      </div>
      <input className={styles.search} placeholder="Search in this book" />
      <div className={styles.list}>
        {outline.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📑</span>
            <p className={styles.emptyText}>No chapters available</p>
          </div>
        ) : (
          outline.map((item, idx) => (
            <button 
              key={idx} 
              className={styles.item} 
              onClick={() => onJump?.(item.page)}
              title={item.title}
            >
              <span className={styles.itemNumber}>{idx + 1}</span>
              <span className={styles.itemTitle}>{item.title}</span>
              {item.page && <span className={styles.itemPage}>p.{item.page}</span>}
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
