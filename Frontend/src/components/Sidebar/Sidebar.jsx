import React from 'react'
import styles from './Sidebar.module.css'

export default function Sidebar({ outline = [], onJump }) {
  return (
    <aside className={styles.sidebar}>
      <input className={styles.search} placeholder="Search in this book" />
      <div className={styles.list}>
        {outline.map((item, idx) => (
          <button key={idx} className={styles.item} onClick={() => onJump?.(item.page)}>
            {item.title}
          </button>
        ))}
      </div>
    </aside>
  )
}
