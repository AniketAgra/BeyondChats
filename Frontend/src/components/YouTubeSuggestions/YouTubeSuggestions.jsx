import React, { useState } from 'react'
import styles from './YouTubeSuggestions.module.css'

export default function YouTubeSuggestions({ videos = [] }) {
  const [active, setActive] = useState(null)
  return (
    <div className={styles.section}>
      <h3>Recommended Videos</h3>
      <div className={styles.grid}>
        {videos.map((v) => (
          <div key={v.id} className={styles.card}>
            <div className={styles.thumb} onClick={() => setActive(v)}>
              <img src={v.thumbnail} alt={v.title} />
              <div className={styles.play}>▶</div>
            </div>
            <div className={styles.title} title={v.title}>{v.title}</div>
            <div className={styles.meta}>{v.channelTitle} · {v.duration}</div>
            <div className={styles.buttons}>
              <a className="btn" href={v.url} target="_blank" rel="noreferrer">Watch Now</a>
              <button className="btn secondary">Save Later</button>
            </div>
          </div>
        ))}
      </div>
      {active && (
        <div className={styles.modal} onClick={() => setActive(null)}>
          <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <iframe width="560" height="315" src={`https://www.youtube.com/embed/${active.id.includes('mock') ? 'dQw4w9WgXcQ' : active.id}`} title={active.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
            <div className={styles.modalSide}>
              <h4>{active.title}</h4>
              <p>Channel: {active.channelTitle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
