import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import PDFViewer from '../components/PDFViewer/PDFViewer.jsx'
import RightPanel from '../components/RightPanel/RightPanel.jsx'
import FloatingAIBuddy from '../components/AIBuddy/FloatingAIBuddy.jsx'
import { pdfApi, ytApi, keyFeaturesApi } from '../utils/api.js'
import styles from './PDFPage.module.css'

export default function PDFPage() {
  const { state } = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState('')
  const [videos, setVideos] = useState([])
  const [fileSrc, setFileSrc] = useState(state?.pdfUrl || state?.url || state?.file || null)
  const [docMeta, setDocMeta] = useState(state || null)
  const [keyPoints, setKeyPoints] = useState([])
  const [keyFeaturesStatus, setKeyFeaturesStatus] = useState('loading')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const videosFetchedRef = useRef(false)

  useEffect(() => {
    // Reset videos fetched flag when PDF changes
    videosFetchedRef.current = false
    setVideos([])
    
    ;(async () => {
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
      const previousStatus = keyFeaturesStatus
      setKeyFeaturesStatus(result.status || 'not_found')
      setKeyPoints(result.keyPoints || [])
      
      // If key features are ready and we have key points, fetch videos if we haven't already
      if (result.status === 'completed' && result.keyPoints?.length > 0 && !videosFetchedRef.current) {
        console.log('Key features ready, fetching YouTube videos...')
        videosFetchedRef.current = true
        await fetchYouTubeVideos(result.keyPoints)
      }
      
      // If still generating or pending, poll again
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

  const handleGenerateQuiz = () => {
    navigate(`/quiz?pdfId=${id}`)
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
    <div 
      className={`${styles.pdfPageLayout} ${isFullscreen ? styles.fullscreen : ''}`}
    >
      <Sidebar keyPoints={keyPoints} status={keyFeaturesStatus} isCollapsed={isFullscreen} onGenerateQuiz={handleGenerateQuiz} />
      <div className={styles.mainContent}>
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
        
        {/* Toggle button for right panel */}
        <button 
          className={styles.rightPanelToggle}
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          title={isRightPanelOpen ? "Close panel" : "Open panel"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isRightPanelOpen ? (
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            ) : (
              <path d="M9 18l6-6-6-6"/>
            )}
          </svg>
        </button>
      </div>
      <RightPanel 
        pdfId={id} 
        notePdfId={docMeta?.id} 
        page={currentPage} 
        isCollapsed={isFullscreen}
        isOpen={isRightPanelOpen}
        onClose={() => setIsRightPanelOpen(false)}
        keyPoints={keyPoints}
      />
    </div>
  )
}
