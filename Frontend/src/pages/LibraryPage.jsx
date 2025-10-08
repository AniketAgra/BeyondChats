import React, { useEffect, useMemo, useState } from 'react'
import styles from './LibraryPage.module.css'
import { useNavigate } from 'react-router-dom'
import { pdfApi, keyFeaturesApi } from '../utils/api.js'
import UploadPDFModal from '../components/modals/UploadPDFModal.jsx'
import DeletePDFModal from '../components/modals/DeletePDFModal.jsx'
import { RiDeleteBin6Line } from 'react-icons/ri'

// Load data from API (no dummy items)

export default function LibraryPage() {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [openUpload, setOpenUpload] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [keyFeaturesMap, setKeyFeaturesMap] = useState({}) // { pdfId: { status, keyPoints } }
  const nav = useNavigate()

  // Truncate text by word count
  const truncateByWords = (text, maxWords = 15) => {
    const words = text.split(/\s+/)
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ') + '...'
  }

  // Generate a nice, deterministic gradient based on a string (title/id)
  function stringToGradient(str = '') {
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i)
    const h1 = Math.abs(hash) % 360
    const h2 = (h1 + 40 + (Math.abs(hash) % 80)) % 360
    const s1 = 65
    const s2 = 70
    const l1 = 78
    const l2 = 68
    return `linear-gradient(135deg, hsl(${h1} ${s1}% ${l1}%), hsl(${h2} ${s2}% ${l2}%))`
  }

  const getInitials = (name = 'PDF') =>
    name
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'PDF'

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
      
      // Fetch key features for all PDFs
      fetchKeyFeaturesForAll(mapped.map(it => it.id))
    } catch (e) {
      console.error('Failed to load PDFs', e)
    }
  }

  async function fetchKeyFeaturesForAll(pdfIds) {
    const map = {}
    for (const pdfId of pdfIds) {
      try {
        const result = await keyFeaturesApi.get(pdfId)
        map[pdfId] = {
          status: result.status || 'not_found',
          keyPoints: result.keyPoints || []
        }
      } catch (e) {
        map[pdfId] = { status: 'error', keyPoints: [] }
      }
    }
    setKeyFeaturesMap(map)
    
    // Poll for any that are still generating
    const generating = Object.entries(map).filter(([_, v]) => v.status === 'generating')
    if (generating.length > 0) {
      setTimeout(() => {
        fetchKeyFeaturesForAll(generating.map(([id]) => id))
      }, 3000) // Poll every 3 seconds
    }
  }

  useEffect(() => { loadList() }, [])

  const selected = useMemo(() => items.find(i => i.id === selectedId), [items, selectedId])

  const onUploaded = async (pdf) => {
    const newId = String(pdf?._id || pdf?.id || '') || undefined
    await loadList(newId)
    setOpenUpload(false)
  }

  const handleDeleteClick = () => {
    if (!selected) return
    setOpenDelete(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selected) return
    
    try {
      await pdfApi.delete(selected.id)
      setOpenDelete(false)
      // Reload the list without the deleted PDF
      await loadList()
    } catch (e) {
      console.error('Failed to delete PDF', e)
      alert('Failed to delete PDF. Please try again.')
      setOpenDelete(false)
    }
  }

  const handleDeleteCancel = () => {
    setOpenDelete(false)
  }

  return (
    <div className="container">
      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>My Library</span>
            <div className={styles.sidebarActions}>
              <button
                className={styles.uploadMini}
                onClick={() => setOpenUpload(true)}
                aria-label="Upload PDF"
                title="Upload PDF"
              >
                + Upload
              </button>
            </div>
          </div>
          <button className={styles.allPdfs} type="button" aria-label="Show all PDFs">
            <span className={styles.allPdfsIcon} aria-hidden>▦</span>
            <span>All PDFs</span>
          </button>
          <div className={styles.list} role="list">
            {items.length === 0 && (
              <div className={styles.emptyList}>No PDFs uploaded yet</div>
            )}
            {items.map((it) => (
              <div key={it.id} className={`${styles.item} ${selectedId === it.id ? styles.active : ''}`} onClick={() => setSelectedId(it.id)} role="listitem" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedId(it.id)}>
                <div
                  className={styles.thumb}
                  style={{ background: stringToGradient(it.name || it.id) }}
                  aria-hidden
                >
                  <span className={styles.thumbText}>{getInitials(it.name)}</span>
                </div>
                <div className={styles.itemMain}>
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
                {selected?.imageUrl ? (
                  <img alt={`${selected?.name} cover`} src={selected.imageUrl} />
                ) : (
                  <div
                    className={styles.coverPh}
                    style={{ background: stringToGradient(selected?.name || selected?.id) }}
                    aria-label={`${selected?.name} cover placeholder`}
                  >
                    <span className={styles.coverTitle}>{selected?.name}</span>
                  </div>
                )}
              </div>
              <div className={styles.details}>
                <div className={styles.title}>{selected?.name}</div>
                <div className={styles.subtitle}>
                  {selected?.author} • Uploaded on {new Date(selected?.date || Date.now()).toLocaleString()} • {selected?.pages || '-'} pages
                </div>
                <div style={{ fontWeight: 700 }}>Key Points</div>
                {(() => {
                  const keyFeaturesData = keyFeaturesMap[selected?.id]
                  const isGenerating = keyFeaturesData?.status === 'generating' || keyFeaturesData?.status === 'pending'
                  const keyPoints = keyFeaturesData?.keyPoints || []
                  
                  if (isGenerating) {
                    return (
                      <div className={styles.keyPointsLoading}>
                        <div className={styles.loadingPulse}></div>
                        <div className={styles.loadingText}>Generating key points...</div>
                      </div>
                    )
                  }
                  
                  if (!keyPoints.length) {
                    return (
                      <div className={styles.keyPointsEmpty}>
                        <span>No key points available yet</span>
                      </div>
                    )
                  }
                  
                  const displayPoints = keyPoints.slice(0, 5)
                  const hasMore = keyPoints.length > 5
                  
                  return (
                    <div className={styles.keyPoints}>
                      {displayPoints.map((kp, i) => (
                        <div key={i} className={styles.keyPoint} title={kp}>
                          <span className={styles.keyPointBullet}>•</span>
                          <span>{truncateByWords(kp, 15)}</span>
                        </div>
                      ))}
                      {hasMore && (
                        <div className={styles.keyPointMore}>
                          ...
                        </div>
                      )}
                    </div>
                  )
                })()}
                <div className={styles.actions}>
                  <button className={styles.deleteBtn} onClick={handleDeleteClick} title="Delete PDF and all related data">
                    <RiDeleteBin6Line className={styles.deleteIcon} />
                    Delete
                  </button>
                  <button className={styles.open} onClick={() => nav(`/pdf/${selected?.id}`, { state: selected })}>Open in Viewer</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      <UploadPDFModal open={openUpload} onClose={() => setOpenUpload(false)} onUploaded={onUploaded} />
      <DeletePDFModal 
        open={openDelete} 
        onClose={handleDeleteCancel} 
        onConfirm={handleDeleteConfirm}
        pdfName={selected?.name || 'this PDF'}
      />
    </div>
  )
}
