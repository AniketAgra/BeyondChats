import React, { useEffect, useState } from 'react'
import { analyticsApi } from '../utils/api.js'
import OverviewCards from '../components/Dashboard/OverviewCards.jsx'
import LearningAnalytics from '../components/Dashboard/LearningAnalytics.jsx'
import PDFInsights from '../components/Dashboard/PDFInsights.jsx'
import TopicInsights from '../components/Dashboard/TopicInsights.jsx'
import Recommendations from '../components/Dashboard/Recommendations.jsx'
import RecentActivity from '../components/Dashboard/RecentActivity.jsx'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [topicMastery, setTopicMastery] = useState([])
  const [pdfInsights, setPdfInsights] = useState([])
  const [timeSpent, setTimeSpent] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [weakTopics, setWeakTopics] = useState([])
  const [weakTopicsData, setWeakTopicsData] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load all analytics data in parallel
      const [overviewData, topicData, insightsData, timeData, recsData] = await Promise.all([
        analyticsApi.overview(),
        analyticsApi.topicMastery(),
        analyticsApi.pdfInsights(),
        analyticsApi.timeSpent(),
        analyticsApi.recommendations()
      ])

      setDashboardData(overviewData)
      setTopicMastery(topicData.heatmapData || [])
      setPdfInsights(insightsData.insights || [])
      setTimeSpent(timeData.timeData || [])
      setRecommendations(recsData.recommendations || [])
      setWeakTopics(recsData.weakTopics || [])
      setWeakTopicsData(recsData.weakTopicsData || [])
    } catch (e) {
      console.error('Failed to load dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your learning insights...</p>
        </div>
      </div>
    )
  }

  // Generate AI summary for PDF insights
  const topPdfSummary = dashboardData?.topPdf 
    ? `You're most engaged with "${dashboardData.topPdf.title}", with ${dashboardData.topPdf.attempts} attempts and an average score of ${dashboardData.topPdf.avgScore}%, showing ${parseFloat(dashboardData.topPdf.avgScore) >= 75 ? 'steady improvement' : 'room for growth'}.`
    : null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Learning Journey</h1>
          <p className={styles.subtitle}>
            Track your progress, identify strengths, and focus on improvement areas
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <OverviewCards data={dashboardData} />

      {/* Learning Analytics Charts */}
      <LearningAnalytics 
        performanceTrend={dashboardData?.performanceTrend || []}
        topicMastery={topicMastery}
        timeSpent={timeSpent}
      />

      {/* Topic Insights - New Section */}
      <TopicInsights topicInsights={dashboardData?.topicInsights} />

      {/* PDF Insights */}
      <PDFInsights 
        insights={pdfInsights}
        summary={topPdfSummary}
      />

      {/* Recommendations */}
      <Recommendations 
        recommendations={recommendations}
        weakTopics={weakTopics}
        weakTopicsData={weakTopicsData}
      />

      {/* Recent Activity */}
      <RecentActivity activities={dashboardData?.recentActivity || []} />
    </div>
  )
}
