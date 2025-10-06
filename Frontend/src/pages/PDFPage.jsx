import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import PDFViewer from '../components/PDFViewer/PDFViewer.jsx'
import ChatPanel from '../components/ChatPanel/ChatPanel.jsx'
import NotesPanel from '../components/NotesPanel/NotesPanel.jsx'
import { pdfApi, ytApi } from '../utils/api.js'

export default function PDFPage() {
  const { state } = useLocation()
  const { id } = useParams()
  const [summary, setSummary] = useState('')
  const [videos, setVideos] = useState([])
  const [fileSrc, setFileSrc] = useState(state?.file || null)
  const [docMeta, setDocMeta] = useState(state || null)
  const outline = useMemo(() => [
    { title: 'Introduction', page: 1 },
    { title: 'Chapter 1: The Basics', page: 2 },
    { title: 'Chapter 2: Advanced Concepts', page: 5 }
  ], [])

  useEffect(() => {
    (async () => {
      if (!state && id) {
        try {
          const data = await pdfApi.get(id)
          setDocMeta({ id: data.id, name: data.filename, url: data.url })
          setFileSrc(data.url)
        } catch (e) {
          console.error('Failed to load PDF meta', e)
        }
      }
    })()
  }, [id, state])

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
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 360px', gap: 0, height: 'calc(100vh - 64px)' }}>
      <Sidebar outline={outline} onJump={() => {}} />
      <div className="container" style={{ paddingTop: 16 }}>
  <PDFViewer file={fileSrc} summary={summary} videos={videos} onSummarize={onSummarize} />
      </div>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', borderLeft: '1px solid var(--border)' }}>
  <ChatPanel pdfId={id} />
  <NotesPanel pdfId={docMeta?.id} page={1} />
      </div>
    </div>
  )
}
