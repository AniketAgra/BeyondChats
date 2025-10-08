import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styles from './AIBuddyPage.module.css'
import YouTubeSuggestions from '../components/YouTubeSuggestions/YouTubeSuggestions.jsx'
import { ytApi } from '../utils/api.js'

export default function AIBuddyPage() {
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('topic')
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (topic) {
      loadVideos(topic)
    }
  }, [topic])

  const loadVideos = async (searchTopic) => {
    try {
      setLoading(true)
      const videoResults = await ytApi.suggest(searchTopic)
      setVideos(videoResults || [])
    } catch (error) {
      console.error('Failed to load videos:', error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      {topic ? (
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>📚 Learn More About: {topic}</h1>
            <p className={styles.subtitle}>
              Watch these educational videos to improve your understanding
            </p>
          </div>
          
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading video recommendations...</p>
            </div>
          ) : videos.length > 0 ? (
            <YouTubeSuggestions videos={videos} />
          ) : (
            <div className={styles.noVideos}>
              <p>No videos found for this topic.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.container}>
          <h1 className={styles.title}>aurora</h1>
          <p className={styles.subtitle}>Your AI learning companion</p>
        </div>
      )}
    </div>
  )
}
