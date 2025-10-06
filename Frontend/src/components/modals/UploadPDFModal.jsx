import { useState } from 'react'
import styles from './UploadPDFModal.module.css'
import { pdfApi } from '../../utils/api'

export default function UploadPDFModal({ open, onClose, onUploaded }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [mode, setMode] = useState('file') // 'file' | 'url'
  const [pdfUrl, setPdfUrl] = useState('')
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Note name is required')
    if (mode === 'file') {
      if (!file) return setError('Please choose a PDF file')
    } else {
      if (!pdfUrl.trim()) return setError('Please paste a PDF URL')
      if (!/^https?:\/\//i.test(pdfUrl.trim())) return setError('Enter a valid http(s) URL')
      if (!/\.pdf($|[?#])/i.test(pdfUrl.trim())) {
        // allow Cloudinary transformed URLs without .pdf, but warn lightly
      }
    }
    try {
      setLoading(true)
      setProgress(0)
      if (mode === 'file') {
        // Build a FormData because backend expects multipart
        const fd = new FormData()
        fd.append('pdf', file)
        fd.append('title', title.trim())
        if (author) fd.append('author', author)
        if (imageUrl) fd.append('imageUrl', imageUrl)
        const { data } = await pdfApi.__rawUpload(fd, (p) => setProgress(p))
        setLoading(false)
        onUploaded?.(data?.pdf || data)
        onClose?.()
      } else {
        const res = await pdfApi.uploadByUrl({ url: pdfUrl.trim(), title: title.trim(), author, imageUrl })
        setLoading(false)
        onUploaded?.(res?.pdf || res)
        onClose?.()
      }
    } catch (e2) {
      setLoading(false)
      setError(e2?.response?.data?.error || e2.message || 'Upload failed')
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="upload-title">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3 id="upload-title" className={styles.title}>Upload PDF</h3>
            <p className={styles.subtitle}>Add a title and optional details, then choose a PDF.</p>
          </div>
          <button aria-label="Close" className={styles.close} onClick={onClose} disabled={loading}>×</button>
        </div>
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.modeSwitch} role="tablist" aria-label="Upload mode">
            <button type="button" role="tab" aria-selected={mode==='file'} className={mode==='file'?styles.tabActive:styles.tab}
              onClick={()=>setMode('file')} disabled={loading}>From file</button>
            <button type="button" role="tab" aria-selected={mode==='url'} className={mode==='url'?styles.tabActive:styles.tab}
              onClick={()=>setMode('url')} disabled={loading}>From URL</button>
          </div>
          <label>
            Note name*
            <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., Physics Class 11" required />
          </label>
          <label>
            Author
            <input type="text" value={author} onChange={(e)=>setAuthor(e.target.value)} placeholder="Optional" />
          </label>
          <label>
            Image URL
            <input type="url" value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} placeholder="Optional cover image" />
          </label>
          {mode === 'file' ? (
            <label>
              PDF file*
              <input type="file" accept="application/pdf" onChange={(e)=>setFile(e.target.files?.[0]||null)} required={mode==='file'} />
              {file && (
                <span className={styles.fileMeta}>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</span>
              )}
            </label>
          ) : (
            <label>
              PDF URL*
              <input type="url" value={pdfUrl} onChange={(e)=>setPdfUrl(e.target.value)} placeholder="Paste a direct PDF URL" required={mode==='url'} />
              <span className={styles.hint}>Example: https://your-domain/files/your.pdf</span>
            </label>
          )}

          {error && <div className={styles.error}>{error}</div>}
          {loading && (
            <div className={styles.progress} aria-live="polite"><div style={{ width: `${progress}%` }} /></div>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className={styles.primary} disabled={loading}>{loading ? (mode==='file'?'Uploading…':'Saving…') : (mode==='file'?'Upload':'Save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
