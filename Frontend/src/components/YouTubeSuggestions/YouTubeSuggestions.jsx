import React, { useState } from 'react'
import styles from './YouTubeSuggestions.module.css'

export default function YouTubeSuggestions({ videos = [] }) {
  const [active, setActive] = useState(null)
  return (
    <div className={styles.section}>
      <h3 className={styles.heading}>Recommended Videos</h3>
      <div className={styles.grid}>
        {videos.map((v) => (
          <div key={v.id} className={styles.card}>
            <div className={styles.thumb} onClick={() => setActive(v)}>
              <img src={v.thumbnail} alt={v.title} />
              <div className={styles.overlay}>
                <div className={styles.playButton}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className={styles.info}>
              <h4 className={styles.title} title={v.title}>{v.title}</h4>
              <p className={styles.channel}>{v.channelTitle}</p>
            </div>
          </div>
        ))}
      </div>
      {active && (
        <div className={styles.modal} onClick={() => setActive(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setActive(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className={styles.videoWrapper}>
              <iframe 
                src={`https://www.youtube.com/embed/${active.id.includes('mock') ? 'dQw4w9WgXcQ' : active.id}?autoplay=1`} 
                title={active.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>
            <div className={styles.videoInfo}>
              <h3>{active.title}</h3>
              <p className={styles.channelName}>{active.channelTitle}</p>
              <a 
                href={active.url} 
                target="_blank" 
                rel="noreferrer" 
                className={styles.watchOnYoutube}
              >
                Watch on YouTube →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
