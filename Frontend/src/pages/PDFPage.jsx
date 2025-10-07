import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import PDFViewer from '../components/PDFViewer/PDFViewer.jsx'
import RightPanel from '../components/RightPanel/RightPanel.jsx'
import FloatingAIBuddy from '../components/AIBuddy/FloatingAIBuddy.jsx'
import { pdfApi, ytApi, keyFeaturesApi } from '../utils/api.js'

export default function PDFPage() {
  const { state } = useLocation()
  const { id } = useParams()
  const [summary, setSummary] = useState('')
  const [videos, setVideos] = useState([])
  const [fileSrc, setFileSrc] = useState(state?.pdfUrl || state?.url || state?.file || null)
  const [docMeta, setDocMeta] = useState(state || null)
  const [keyPoints, setKeyPoints] = useState([])
  const [keyFeaturesStatus, setKeyFeaturesStatus] = useState('loading')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

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
        
        // Fetch key features
        fetchKeyFeatures()
      } catch (e) {
        // If resolution fails and we have state, fall back to state url
  if (state?.pdfUrl || state?.url) setFileSrc({ url: state.pdfUrl || state.url, withCredentials: false })
      }
    })()
  }, [id])

  async function fetchKeyFeatures() {
    if (!id) return
    try {
      const result = await keyFeaturesApi.get(id)
      setKeyFeaturesStatus(result.status || 'not_found')
      setKeyPoints(result.keyPoints || [])
      
      // If key features are ready and we haven't fetched videos yet, suggest videos automatically
      if (result.status === 'completed' && result.keyPoints?.length > 0 && videos.length === 0) {
        await fetchYouTubeVideos(result.keyPoints)
      }
      
      // If still generating, poll again
      if (result.status === 'generating' || result.status === 'pending') {
        setTimeout(fetchKeyFeatures, 3000)
      }
    } catch (e) {
      console.error('Failed to fetch key features:', e)
      setKeyFeaturesStatus('error')
    }
  }

  async function fetchYouTubeVideos(keyPointsArray) {
    try {
      // Combine PDF name and key points to create a topic for video suggestions
      const topic = `${docMeta?.name || docMeta?.filename || ''} ${keyPointsArray.join(' ')}`.trim().slice(0, 300)
      console.log('Fetching videos for topic:', topic)
      const vids = await ytApi.suggest(topic)
      console.log('Videos received:', vids)
      setVideos(vids)
    } catch (err) {
      console.error('Failed to fetch YouTube videos:', err)
    }
  }

  const onSummarize = async () => {
    if (!fileSrc && !docMeta?.id) return
    try {
      console.log('Starting summarization...')
      const { summary } = await pdfApi.summarize({ file: state?.file, pdfId: docMeta?.id })
      console.log('Summary received:', summary)
      setSummary(summary)
      return summary
    } catch (err) {
      console.error('Summarize failed', err)
      const msg = err?.response?.data?.error || err?.message || 'Failed to summarize'
      alert(msg)
      throw err
    }
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: isFullscreen 
        ? 'minmax(60px, 60px) minmax(0, 1fr) minmax(60px, 60px)' 
        : 'minmax(260px, 260px) minmax(0, 1fr) minmax(360px, 360px)', 
      gap: 0, 
      height: 'calc(100vh - 64px)', 
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw',
      transition: 'grid-template-columns 0.3s ease'
    }}>
      <Sidebar keyPoints={keyPoints} status={keyFeaturesStatus} isCollapsed={isFullscreen} />
      <div className="container" style={{ 
        paddingTop: 16,
        paddingLeft: isFullscreen ? 8 : 16,
        paddingRight: isFullscreen ? 8 : 16,
        height: '100%', 
        minHeight: 0, 
        minWidth: 0,
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <PDFViewer 
          file={fileSrc} 
          summary={summary} 
          videos={videos} 
          onSummarize={onSummarize}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onPageChange={setCurrentPage}
        />
        <FloatingAIBuddy isPDFPage={true} />
      </div>
      <RightPanel pdfId={id} notePdfId={docMeta?.id} page={currentPage} isCollapsed={isFullscreen} />
    </div>
  )
}
