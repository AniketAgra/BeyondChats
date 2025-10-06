import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pdfApi } from '../utils/api.js'

export default function SourceSelector() {
  const [items, setItems] = useState([])
  const inputRef = useRef(null)
  const nav = useNavigate()

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // parse to get basic metadata
    const parsed = await pdfApi.parse(file)
    const id = `${Date.now()}`
    setItems((x) => [{ id, name: file.name, pages: parsed.numPages, file }, ...x])
  }

  return (
    <div className="container">
      <h1>My Library</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        <div>
          <button className="btn" onClick={() => inputRef.current?.click()}>Upload PDF</button>
          <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={onUpload} />
          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            {items.map((it) => (
              <button key={it.id} className="card" style={{ padding: 12, textAlign: 'left' }} onClick={() => nav(`/pdf/${it.id}`, { state: it })}>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                <div style={{ color: 'var(--muted)' }}>{it.pages} pages</div>
              </button>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3>Preview</h3>
          <p>Select a PDF from the list to open it in the viewer.</p>
        </div>
      </div>
    </div>
  )
}
