import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import PDFViewer from '../components/PDFViewer/PDFViewer.jsx'
import ChatPanel from '../components/ChatPanel/ChatPanel.jsx'
import NotesPanel from '../components/NotesPanel/NotesPanel.jsx'
import { pdfApi, ytApi } from '../utils/api.js'

export default function PDFPage() {
  const { state } = useLocation()
  const [summary, setSummary] = useState('')
  const [videos, setVideos] = useState([])
  const outline = useMemo(() => [
    { title: 'Introduction', page: 1 },
    { title: 'Chapter 1: The Basics', page: 2 },
    { title: 'Chapter 2: Advanced Concepts', page: 5 }
  ], [])

  const onSummarize = async () => {
    if (!state?.file) return
    try {
      const { summary } = await pdfApi.summarize({ file: state.file, pdfId: state.id })
      setSummary(summary)
      const vids = await ytApi.suggest(summary?.slice(0, 64))
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
        <PDFViewer file={state?.file} summary={summary} videos={videos} onSummarize={onSummarize} />
      </div>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', borderLeft: '1px solid var(--border)' }}>
        <ChatPanel />
        <NotesPanel pdfId={state?.id} page={1} />
      </div>
    </div>
  )
}
