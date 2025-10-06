import React, { useEffect, useRef, useState } from 'react'
import styles from './NotesPanel.module.css'
import { notesApi } from '../../utils/api.js'

export default function NotesPanel({ pdfId, page }) {
  const [tab, setTab] = useState('text')
  const [text, setText] = useState('')
  const [items, setItems] = useState([])
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => { (async () => setItems(await notesApi.list(pdfId)))() }, [pdfId])

  const saveText = async () => {
    const saved = await notesApi.create({ type: 'text', content: text, page, pdfId })
    setItems((x) => [saved, ...x])
  }

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(stream)
    rec.ondataavailable = (e) => chunksRef.current.push(e.data)
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const base64 = await blobToBase64(blob)
      chunksRef.current = []
      const saved = await notesApi.create({ type: 'audio', content: base64, page, pdfId })
      setItems((x) => [saved, ...x])
    }
    mediaRecorderRef.current = rec
    rec.start()
  }

  const stopRec = () => mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop()

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        <button onClick={() => setTab('text')} className={tab==='text'?styles.active:''}>Text Notes</button>
        <button onClick={() => setTab('audio')} className={tab==='audio'?styles.active:''}>Audio Notes</button>
      </div>
      {tab === 'text' ? (
        <div className={styles.textTab}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your note…" />
          <button className="btn" onClick={saveText}>Save Note</button>
        </div>
      ) : (
        <div className={styles.audioTab}>
          <div className={styles.controls}>
            <button className="btn" onClick={startRec}>Record</button>
            <button className="btn secondary" onClick={stopRec}>Stop</button>
          </div>
        </div>
      )}
      <div className={styles.list}> 
        {items.map((n,i) => (
          <div key={i} className={styles.noteItem}>
            <div className={styles.meta}>Page {n.page} · {new Date(n.createdAt||Date.now()).toLocaleString()}</div>
            {n.type==='text' ? (<div>{n.content}</div>) : (<audio controls src={n.content} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  })
}
