import React, { useEffect, useMemo, useState } from 'react'
import styles from './LibraryPage.module.css'
import { useNavigate } from 'react-router-dom'
import { pdfApi } from '../utils/api.js'
import UploadPDFModal from '../components/modals/UploadPDFModal.jsx'

// Load data from API (no dummy items)

export default function LibraryPage() {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [openUpload, setOpenUpload] = useState(false)
  const nav = useNavigate()

  async function loadList(selectNewId) {
    try {
      const list = await pdfApi.list()
      const mapped = list.map(it => ({
        id: it.id,
        name: it.title || it.filename?.replace(/\.pdf$/i, '') || it.filename || 'PDF',
        author: it.author || 'Unknown',
        date: (it.uploadedAt || it.createdAt || new Date()).toString(),
        pages: it.pages || '-',
        url: it.pdfUrl || it.url,
        chapters: Array.isArray(it.chapters) ? it.chapters : [],
        imageUrl: it.imageUrl || null,
      }))
      setItems(mapped)
      setSelectedId(prev => selectNewId || prev || (mapped[0]?.id || null))
    } catch (e) {
      console.error('Failed to load PDFs', e)
    }
  }

  useEffect(() => { loadList() }, [])

  const selected = useMemo(() => items.find(i => i.id === selectedId), [items, selectedId])

  const onUploaded = async (pdf) => {
    const newId = String(pdf?._id || pdf?.id || '') || undefined
    await loadList(newId)
    setOpenUpload(false)
  }

  return (
    <div className="container">
      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span style={{ fontSize: 18 }}>My Library</span>
          </div>
          <div className={styles.list}>
            {items.length === 0 && (
              <div className={styles.emptyList}>No PDFs uploaded yet</div>
            )}
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
            <button className={styles.uploadBtn} onClick={() => setOpenUpload(true)}>Upload PDF</button>
          </div>
        </aside>

        <section className={styles.preview}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📄</div>
              <div className={styles.emptyTitle}>No PDFs uploaded</div>
              <div className={styles.emptySubtitle}>Upload your first PDF to start generating chapters, notes, and quizzes.</div>
              <div className={styles.emptyActions}>
                <button className={styles.open} onClick={() => setOpenUpload(true)}>Upload PDF</button>
              </div>
            </div>
          ) : (
            <div className={styles.previewBody}>
              <div className={styles.cover}>
                {/* Placeholder cover */}
                <img alt="cover" src={selected?.imageUrl || `https://dummyimage.com/480x640/e5f3ef/0a0a0a&text=${encodeURIComponent((selected?.name||'PDF').slice(0,20))}`} />
              </div>
              <div className={styles.details}>
                <div className={styles.title}>{selected?.name}</div>
                <div className={styles.subtitle}>{selected?.author} • Uploaded on {selected?.date} • {selected?.pages} pages</div>
                <div style={{ fontWeight: 700 }}>Chapters</div>
                <div className={styles.chapters}>
                  {(selected?.chapters?.length ? selected.chapters : ["Functions and Models","Limits and Derivatives","Differentiation Rules","Applications of Differentiation","Integrals","Applications of Integration"]).map((c, i) => (
                    <div key={i} className={styles.chapter}>{i+1}. {c}</div>
                  ))}
                </div>
                <div className={styles.actions}>
                  <button className={styles.open} onClick={() => nav(`/pdf/${selected?.id}`, { state: selected })}>Open in Viewer</button>
                  <button className={styles.secondary}>Share</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      <UploadPDFModal open={openUpload} onClose={() => setOpenUpload(false)} onUploaded={onUploaded} />
    </div>
  )
}
