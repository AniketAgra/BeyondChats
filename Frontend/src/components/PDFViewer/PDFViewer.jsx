import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import styles from './PDFViewer.module.css'
import YouTubeSuggestions from '../YouTubeSuggestions/YouTubeSuggestions.jsx'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PDFViewer({ file, summary, videos, onSummarize, isFullscreen, onToggleFullscreen, onPageChange }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const containerRef = useRef(null)
  const summaryRef = useRef(null)
  const toolbarRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(780)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [hideToolbar, setHideToolbar] = useState(false)
  function onDocumentLoadSuccess({ numPages }) { setNumPages(numPages) }

  // Notify parent component when page changes
  useEffect(() => {
    if (onPageChange) {
      onPageChange(pageNumber)
    }
  }, [pageNumber, onPageChange])

  // Hide toolbar when it reaches the summary section
  useEffect(() => {
    if (!summaryRef.current || !showSummary) {
      setHideToolbar(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide toolbar when summary section is in view
        setHideToolbar(entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '-80px 0px 0px 0px' // Offset for toolbar height
      }
    )

    observer.observe(summaryRef.current)
    return () => observer.disconnect()
  }, [showSummary])

  // Update loading state when summary is received
  useEffect(() => {
    if (summary && isLoadingSummary) {
      setIsLoadingSummary(false)
    }
  }, [summary])

  const handleSummarize = async () => {
    setShowSummary(true)
    setIsLoadingSummary(true)
    
    // Scroll to summary section smoothly after a brief delay to let it appear
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
    }, 100)
    
    try {
      await onSummarize()
    } catch (err) {
      setIsLoadingSummary(false)
      setShowSummary(false)
    }
  }

  // Keep the PDF page width responsive to its container to avoid overflow
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width || 780
      // cap maximum width so canvases don't get too large
      // In fullscreen mode, allow wider PDFs
      const maxWidth = isFullscreen ? 1400 : 980
      setContainerWidth(Math.min(maxWidth, Math.max(320, Math.floor(w))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [isFullscreen])

  return (
    <div className={styles.wrapper}>
      <div ref={toolbarRef} className={`${styles.toolbar} ${hideToolbar ? styles.hidden : ''}`}>
        <div className={styles.navGroup}>
          <button
            className={styles.navBtn}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            title="Previous page"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className={styles.meta}>
            <span className={styles.currentPage}>{pageNumber}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.totalPages}>{numPages || '?'}</span>
          </div>
          <button
            className={styles.navBtn}
            onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))}
            disabled={!numPages || pageNumber >= numPages}
            title="Next page"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        <div className={styles.spacer} />
        <button 
          className={styles.fullscreenBtn}
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          )}
        </button>
        <button 
          className={styles.summarizeBtn}
          onClick={handleSummarize}
          disabled={isLoadingSummary}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
          {isLoadingSummary ? 'Generating...' : 'Summarize'}
        </button>
      </div>
      <div className={`${styles.viewer} ${isFullscreen ? styles.fullscreen : ''}`}>
        {file ? (
          <div ref={containerRef} className={`${styles.pageContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess} className={styles.doc}>
              <div className={styles.pageWrap}>
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth}
                  className={styles.pageCanvas}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            </Document>
          </div>
        ) : (
          <div className="card" style={{ padding: 24 }}>Upload a PDF to begin.</div>
        )}
      </div>
      {showSummary && (
        <div 
          ref={summaryRef}
          className={`${styles.summarySection} ${isLoadingSummary ? styles.loading : styles.loaded}`}
        >
          {isLoadingSummary ? (
            <div className={styles.loadingBox + ' card'}>
              <div className={styles.shimmerLine}></div>
              <div className={styles.shimmerLine}></div>
              <div className={styles.shimmerLine}></div>
              <p className={styles.loadingText}>✨ Generating your summary...</p>
            </div>
          ) : summary ? (
            <div className={styles.summary + ' card'}>
              <h3>Auto-generated Summary</h3>
              <div className={`${styles.summaryText} ${isExpanded ? styles.expanded : styles.collapsed}`}>
                {summary}
              </div>
              {summary && summary.length > 300 && (
                <button 
                  className={styles.readMoreBtn} 
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}
      {videos?.length ? (
        <YouTubeSuggestions videos={videos} />
      ) : null}
    </div>
  )
}
