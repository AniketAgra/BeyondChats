import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import styles from './PDFViewer.module.css'
import YouTubeSuggestions from '../YouTubeSuggestions/YouTubeSuggestions.jsx'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PDFViewer({ file, summary, videos, onSummarize }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  function onDocumentLoadSuccess({ numPages }) { setNumPages(numPages) }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button className="btn" onClick={() => setPageNumber((p) => Math.max(1, p - 1))}>Prev</button>
        <div className={styles.meta}>Page {pageNumber} / {numPages || '?'}</div>
        <button className="btn" onClick={() => setPageNumber((p) => Math.min(numPages || p+1, p + 1))}>Next</button>
        <div className={styles.spacer} />
        <button className="btn secondary" onClick={onSummarize}>Summarize PDF</button>
      </div>
      <div className={styles.viewer}>
        {file ? (
          <Document file={file} onLoadSuccess={onDocumentLoadSuccess} className={styles.doc}>
            <Page
              pageNumber={pageNumber}
              width={780}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : (
          <div className="card" style={{ padding: 24 }}>Upload a PDF to begin.</div>
        )}
      </div>
      {summary && (
        <div className={styles.summary + ' card'}>
          <h3>Auto-generated Summary</h3>
          <div className={styles.summaryText}>{summary}</div>
        </div>
      )}
      {videos?.length ? (
        <YouTubeSuggestions videos={videos} />
      ) : null}
    </div>
  )
}
