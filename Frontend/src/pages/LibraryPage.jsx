import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './LibraryPage.module.css'
import { useNavigate } from 'react-router-dom'
import { pdfApi } from '../utils/api.js'

// Load data from API (no dummy items)

export default function LibraryPage() {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        const list = await pdfApi.list()
        setItems(list.map(it => ({
          id: it.id,
          name: it.filename?.replace(/\.pdf$/i, '') || it.filename || 'PDF',
          author: 'Unknown',
          date: (it.uploadedAt || it.createdAt || new Date()).toString(),
          pages: it.pages || '-',
          url: it.url
        })))
        setSelectedId(prev => prev || (list[0]?.id || null))
      } catch (e) {
        console.error('Failed to load PDFs', e)
      }
    })()
  }, [])

  const selected = useMemo(() => items.find(i => i.id === selectedId), [items, selectedId])

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
  // Upload to server + DB with progress
  setUploading(true)
  setProgress(0)
  const uploaded = await pdfApi.upload(file, (p) => setProgress(p))
      const item = {
        id: uploaded.id,
        name: uploaded.filename?.replace(/\.pdf$/i, '') || file.name.replace(/\.pdf$/i, ''),
        author: 'Unknown',
        date: (uploaded.uploadedAt || new Date()).toString(),
        pages: '-',
        url: uploaded.url
      }
      setItems(x => [item, ...x])
      setSelectedId(item.id)
  setUploading(false)
  setProgress(100)
    } catch (err) {
      console.error(err)
      alert('Failed to upload PDF')
  setUploading(false)
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
          {uploading && (
            <div className="card" style={{ padding: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 999 }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-strong)', borderRadius: 999, transition: 'width .15s' }} />
                </div>
                <div style={{ minWidth: 40, textAlign: 'right' }}>{progress}%</div>
              </div>
            </div>
          )}
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
