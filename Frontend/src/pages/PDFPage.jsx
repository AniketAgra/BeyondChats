import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import PDFViewer from '../components/PDFViewer/PDFViewer.jsx'
import RightPanel from '../components/RightPanel/RightPanel.jsx'
import { pdfApi, ytApi } from '../utils/api.js'

export default function PDFPage() {
  const { state } = useLocation()
  const { id } = useParams()
  const [summary, setSummary] = useState('')
  const [videos, setVideos] = useState([])
  const [fileSrc, setFileSrc] = useState(state?.pdfUrl || state?.url || state?.file || null)
  const [docMeta, setDocMeta] = useState(state || null)
  const outline = useMemo(() => [
    { title: 'Introduction', page: 1 },
    { title: 'Chapter 1: The Basics', page: 2 },
    { title: 'Chapter 2: Advanced Concepts', page: 5 }
  ], [])

  useEffect(() => {
    (async () => {
      try {
        if (!id) return
        // Always attempt to resolve a working URL via backend
  const resolved = await pdfApi.getUrl(id)
  if (resolved) setFileSrc({ url: resolved, withCredentials: false })
        if (!docMeta) {
          const data = await pdfApi.get(id)
          setDocMeta({ id: data.id, name: data.title || data.filename, url: data.pdfUrl || data.url })
        }
      } catch (e) {
        // If resolution fails and we have state, fall back to state url
  if (state?.pdfUrl || state?.url) setFileSrc({ url: state.pdfUrl || state.url, withCredentials: false })
      }
    })()
  }, [id])

  const onSummarize = async () => {
    if (!fileSrc && !docMeta?.id) return
    try {
      const { summary } = await pdfApi.summarize({ file: state?.file, pdfId: docMeta?.id })
      setSummary(summary)
      const topic = `${docMeta?.name || docMeta?.filename || ''} ${summary || ''}`.trim().slice(0, 300)
      const vids = await ytApi.suggest(topic)
      setVideos(vids)
    } catch (err) {
      console.error('Summarize failed', err)
      const msg = err?.response?.data?.error || err?.message || 'Failed to summarize'
      alert(msg)
    }
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'minmax(260px, 260px) minmax(0, 1fr) minmax(360px, 360px)', 
      gap: 0, 
      height: 'calc(100vh - 64px)', 
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      <Sidebar outline={outline} onJump={() => {}} />
      <div className="container" style={{ 
        paddingTop: 16,
        paddingLeft: 16,
        paddingRight: 16,
        height: '100%', 
        minHeight: 0, 
        minWidth: 0,
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <PDFViewer file={fileSrc} summary={summary} videos={videos} onSummarize={onSummarize} />
      </div>
      <RightPanel pdfId={id} notePdfId={docMeta?.id} page={1} />
    </div>
  )
}
