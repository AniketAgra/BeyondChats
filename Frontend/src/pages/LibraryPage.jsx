import React, { useMemo, useRef, useState } from 'react'
import styles from './LibraryPage.module.css'
import { useNavigate } from 'react-router-dom'
import { pdfApi } from '../utils/api.js'

// Minimal demo data for UI when nothing uploaded yet
const seed = [
  { id: '1', name: 'Calculus: Early Transcendentals', author: 'James Stewart', date: '2024-01-15', pages: 850 },
  { id: '2', name: 'Linear Algebra and Its Applications', author: 'Gilbert Strang', date: '2024-02-20', pages: 500 },
  { id: '3', name: 'Introduction to Probability', author: 'Blitzstein & Hwang', date: '2024-03-10', pages: 430 }
]

export default function LibraryPage() {
  const [items, setItems] = useState(seed)
  const [selectedId, setSelectedId] = useState(seed[0].id)
  const inputRef = useRef(null)
  const nav = useNavigate()

  const selected = useMemo(() => items.find(i => i.id === selectedId), [items, selectedId])

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await pdfApi.parse(file)
      const id = `${Date.now()}`
      const item = { id, name: file.name.replace(/\.pdf$/i, ''), author: 'Unknown', date: new Date().toISOString().slice(0,10), pages: parsed.numPages, file }
      setItems(x => [item, ...x])
      setSelectedId(id)
    } catch (err) {
      console.error(err)
      alert('Failed to parse PDF')
    }
  }

  return (
    <div className="container">
      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span style={{ fontSize: 18 }}>My Library</span>
          </div>
          <div className={styles.list}>
            {items.map((it) => (
              <div key={it.id} className={`${styles.item} ${selectedId === it.id ? styles.active : ''}`} onClick={() => setSelectedId(it.id)}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg,#a7f3d0,#dbeafe)' }} />
                <div>
                  <div className={styles.itemTitle}>{it.name}</div>
                  <div className={styles.itemMeta}>{new Date(it.date).toLocaleDateString()}</div>
                </div>
                <div className={styles.itemMeta}>{it.pages} pages</div>
              </div>
            ))}
          </div>
          <div className={styles.uploadBar}>
            <button className={styles.uploadBtn} onClick={() => inputRef.current?.click()}>Upload PDF</button>
            <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={onUpload} />
          </div>
        </aside>

        <section className={styles.preview}>
          <div className={styles.previewBody}>
            <div className={styles.cover}>
              {/* Placeholder cover */}
              <img alt="cover" src={`https://dummyimage.com/480x640/e5f3ef/0a0a0a&text=${encodeURIComponent((selected?.name||'PDF').slice(0,20))}`} />
            </div>
            <div className={styles.details}>
              <div className={styles.title}>{selected?.name}</div>
              <div className={styles.subtitle}>{selected?.author} • Uploaded on {selected?.date} • {selected?.pages} pages</div>
              <div style={{ fontWeight: 700 }}>Chapters</div>
              <div className={styles.chapters}>
                {["Functions and Models","Limits and Derivatives","Differentiation Rules","Applications of Differentiation","Integrals","Applications of Integration"].map((c, i) => (
                  <div key={i} className={styles.chapter}>{i+1}. {c}</div>
                ))}
              </div>
              <div className={styles.actions}>
                <button className={styles.open} onClick={() => nav(`/pdf/${selected?.id}`, { state: selected })}>Open in Viewer</button>
                <button className={styles.secondary}>Share</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
