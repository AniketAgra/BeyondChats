import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import QuizAttempt from '../schemas/QuizAttempt.js'
import Pdf from '../schemas/Pdf.js'
import mongoose from 'mongoose'

const router = Router()

// Helper function to calculate study streak
const calculateStreak = (attempts) => {
  if (!attempts || attempts.length === 0) return 0
  
  const dates = [...new Set(attempts.map(a => 
    new Date(a.createdAt).toDateString()
  ))].sort((a, b) => new Date(b) - new Date(a))
  
  let streak = 0
  const today = new Date().toDateString()
  
  for (let i = 0; i < dates.length; i++) {
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() - i)
    
    if (dates[i] === expectedDate.toDateString()) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

// Helper function to calculate learning level (CoC style)
const getLearningLevel = (totalAttempts, avgScore) => {
  // Bronze - Beginner (0-9 quizzes, any score)
  if (totalAttempts < 10) {
    return { 
      level: 'Bronze', 
      tier: 'I',
      icon: '🥉', 
      color: '#cd7f32',
      gradient: 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)',
      description: 'Just getting started'
    }
  }
  
  // Silver - Intermediate (10-24 quizzes, improving)
  if (totalAttempts < 25) {
    return { 
      level: 'Silver', 
      tier: avgScore >= 60 ? 'II' : 'I',
      icon: '🥈', 
      color: '#c0c0c0',
      gradient: 'linear-gradient(135deg, #e8e8e8 0%, #a8a8a8 100%)',
      description: 'Building momentum'
    }
  }
  
  // Gold - Proficient (25-49 quizzes, good performance)
  if (totalAttempts < 50) {
    return { 
      level: 'Gold', 
      tier: avgScore >= 75 ? 'III' : avgScore >= 60 ? 'II' : 'I',
      icon: '🥇', 
      color: '#ffd700',
      gradient: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
      description: 'Strong performance'
    }
  }
  
  // Platinum - Advanced (50-99 quizzes, excellent)
  if (totalAttempts < 100) {
    return { 
      level: 'Platinum', 
      tier: avgScore >= 85 ? 'III' : avgScore >= 70 ? 'II' : 'I',
      icon: '💎', 
      color: '#e5e4e2',
      gradient: 'linear-gradient(135deg, #e5e4e2 0%, #b0c4de 100%)',
      description: 'Exceptional learner'
    }
  }
  
  // Diamond - Elite (100+ quizzes, mastery level)
  if (avgScore >= 90) {
    return { 
      level: 'Diamond', 
      tier: 'III',
      icon: '💠', 
      color: '#b9f2ff',
      gradient: 'linear-gradient(135deg, #b9f2ff 0%, #00bfff 100%)',
      description: 'Elite performer'
    }
  }
  
  // Champion - Master (100+ quizzes, 85-89%)
  if (avgScore >= 85) {
    return { 
      level: 'Champion', 
      tier: 'II',
      icon: '🏆', 
      color: '#ff6b6b',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
      description: 'Champion level'
    }
  }
  
  // Master - Ultimate (100+ quizzes, 80-84%)
  return { 
    level: 'Master', 
    tier: 'I',
    icon: '👑', 
    color: '#9b59b6',
    gradient: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
    description: 'Dedicated master'
  }
}

// Main overview endpoint with all dashboard metrics
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id
    
    // Get all quiz attempts for the user
    const allAttempts = await QuizAttempt.find({ user: userId })
      .populate('pdf', 'title pdfUrl')
      .sort({ createdAt: -1 })
      .lean()
    
    if (allAttempts.length === 0) {
      return res.json({
        overview: {
          totalStudyHours: 0,
          totalQuizzes: 0,
          averageScore: 0,
          streak: 0,
          learningLevel: { level: 'Explorer', icon: '🌱', color: '#10b981' }
        },
        topPdf: null,
        topTopics: [],
        weakTopics: [],
        performanceTrend: [],
        recentActivity: []
      })
    }
    
    // Calculate total study time (assuming average 10 minutes per quiz)
    const totalStudyMinutes = allAttempts.length * 10
    const totalStudyHours = (totalStudyMinutes / 60).toFixed(1)
    
    // Calculate average score
    const avgScore = (allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length).toFixed(1)
    
    // Calculate streak
    const streak = calculateStreak(allAttempts)
    
    // Get learning level
    const learningLevel = getLearningLevel(allAttempts.length, parseFloat(avgScore))
    
    // Find top PDF (most attempted)
    const pdfCounts = {}
    allAttempts.forEach(attempt => {
      if (attempt.pdf && attempt.pdf._id) {
        const pdfId = attempt.pdf._id.toString()
        if (!pdfCounts[pdfId]) {
          pdfCounts[pdfId] = { count: 0, title: attempt.pdf.title || 'Untitled', totalScore: 0 }
        }
        pdfCounts[pdfId].count++
        pdfCounts[pdfId].totalScore += (attempt.score || 0)
      }
    })
    
    const topPdf = Object.entries(pdfCounts)
      .map(([id, data]) => ({
        title: data.title,
        attempts: data.count,
        avgScore: (data.totalScore / data.count).toFixed(1)
      }))
      .sort((a, b) => b.attempts - a.attempts)[0] || null
    
    // Calculate topic mastery
    const topicStats = {}
    allAttempts.forEach(attempt => {
      if (attempt.topic) {
        if (!topicStats[attempt.topic]) {
          topicStats[attempt.topic] = { total: 0, scores: [] }
        }
        topicStats[attempt.topic].total++
        topicStats[attempt.topic].scores.push(attempt.score || 0)
      }
    })
    
    const topicMastery = Object.entries(topicStats)
      .map(([topic, data]) => {
        const avgScore = parseFloat((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1))
        return {
          topic,
          attempts: data.total,
          avgScore: avgScore.toFixed(1),
          accuracy: avgScore.toFixed(1),
          level: avgScore >= 80 ? 'strong' : avgScore >= 60 ? 'moderate' : 'weak'
        }
      })
      .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
    
    const topTopics = topicMastery.slice(0, 3)
    const weakTopics = topicMastery.filter(t => parseFloat(t.avgScore) < 60).slice(0, 3)
    
    // Performance trend (last 10 quizzes)
    const performanceTrend = allAttempts.slice(0, 10).reverse().map(a => ({
      date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: a.score || 0,
      topic: a.topic || 'General'
    }))
    
    // Recent activity (last 10)
    const recentActivity = allAttempts.slice(0, 10).map(a => ({
      date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      topic: a.topic || 'General',
      type: a.difficulty || 'Mixed',
      score: `${a.correct || 0}/${a.total || 0}`,
      accuracy: a.score || 0,
      timeTaken: '8m' // Placeholder
    }))
    
    // Get topic-based performance insights from quiz attempts directly
    let topicInsights = {
      overallWeakTopics: [],
      overallStrongTopics: []
    }
    
    try {
      // Calculate topic performance from quiz attempts
      const topicAggregation = {}
      
      allAttempts.forEach(attempt => {
        if (attempt.topic) {
          if (!topicAggregation[attempt.topic]) {
            topicAggregation[attempt.topic] = {
              topic: attempt.topic,
              totalAttempts: 0,
              totalScore: 0,
              correctAnswers: 0,
              totalQuestions: 0
            }
          }
          topicAggregation[attempt.topic].totalAttempts++
          topicAggregation[attempt.topic].totalScore += (attempt.score || 0)
          topicAggregation[attempt.topic].correctAnswers += (attempt.correct || 0)
          topicAggregation[attempt.topic].totalQuestions += (attempt.total || 0)
        }
      })
      
      const aggregatedTopics = Object.values(topicAggregation).map(t => ({
        ...t,
        accuracy: t.totalAttempts > 0 
          ? Math.round(t.totalScore / t.totalAttempts) 
          : 0
      }))
      
      topicInsights.overallWeakTopics = aggregatedTopics
        .filter(t => t.accuracy < 60 && t.totalAttempts > 0)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5)
        .map(t => ({
          topic: t.topic,
          accuracy: t.accuracy,
          totalQuestions: t.totalQuestions,
          attempts: t.totalAttempts
        }))
      
      topicInsights.overallStrongTopics = aggregatedTopics
        .filter(t => t.accuracy >= 80)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 5)
        .map(t => ({
          topic: t.topic,
          accuracy: t.accuracy,
          totalQuestions: t.totalQuestions,
          attempts: t.totalAttempts
        }))
    } catch (topicError) {
      console.error('Failed to get topic insights:', topicError)
    }
    
    res.json({
      overview: {
        totalStudyHours,
        totalQuizzes: allAttempts.length,
        averageScore: avgScore,
        streak,
        learningLevel
      },
      topPdf,
      topTopics,
      weakTopics,
      performanceTrend,
      recentActivity,
      topicInsights
    })
  } catch (e) {
    console.error('Analytics overview error:', e)
    res.status(500).json({ error: e.message })
  }
})

// Topic mastery heatmap data
router.get('/topic-mastery', requireAuth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean()
    
    const topicData = {}
    attempts.forEach(attempt => {
      const topic = attempt.topic || 'General'
      if (!topicData[topic]) {
        topicData[topic] = []
      }
      topicData[topic].push(attempt.score || 0)
    })
    
    const heatmapData = Object.entries(topicData).map(([topic, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return {
        topic,
        avgScore: avg.toFixed(1),
        attempts: scores.length,
        level: avg >= 80 ? 'strong' : avg >= 60 ? 'moderate' : 'weak'
      }
    })
    
    res.json({ heatmapData })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PDF insights and statistics
router.get('/pdf-insights', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id
    
    // Get all PDFs for user
    const pdfs = await Pdf.find({ user: userId }).lean()
    
    // Get quiz attempts grouped by PDF
    const attempts = await QuizAttempt.find({ user: userId })
      .populate('pdf', 'title')
      .lean()
    
    const pdfStats = {}
    
    attempts.forEach(attempt => {
      if (!attempt.pdf) return
      
      const pdfId = attempt.pdf._id.toString()
      if (!pdfStats[pdfId]) {
        pdfStats[pdfId] = {
          pdfName: attempt.pdf.title || 'Untitled',
          totalReads: 0,
          quizzes: 0,
          scores: [],
          lastAccessed: attempt.createdAt
        }
      }
      
      pdfStats[pdfId].quizzes++
      pdfStats[pdfId].scores.push(attempt.score || 0)
      if (new Date(attempt.createdAt) > new Date(pdfStats[pdfId].lastAccessed)) {
        pdfStats[pdfId].lastAccessed = attempt.createdAt
      }
    })
    
    const insights = Object.values(pdfStats).map(stat => {
      const avgScore = stat.scores.length > 0 
        ? (stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length).toFixed(1)
        : 0
      
      const timeSpent = `${(stat.quizzes * 10 / 60).toFixed(1)}h`
      
      const lastAccessedDate = new Date(stat.lastAccessed)
      const daysAgo = Math.floor((Date.now() - lastAccessedDate) / (1000 * 60 * 60 * 24))
      const lastAccessedStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`
      
      return {
        pdfName: stat.pdfName,
        totalReads: stat.quizzes,
        timeSpent,
        avgScore: `${avgScore}%`,
        accuracy: `${avgScore}%`,
        lastAccessed: lastAccessedStr
      }
    }).sort((a, b) => b.totalReads - a.totalReads)
    
    res.json({ insights })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Time spent analytics
router.get('/time-spent', requireAuth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .lean()
    
    // Group by day
    const dailyTime = {}
    attempts.forEach(attempt => {
      const date = new Date(attempt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dailyTime[date] = (dailyTime[date] || 0) + 10 // 10 minutes per quiz
    })
    
    const timeData = Object.entries(dailyTime)
      .slice(-7) // Last 7 days
      .map(([date, minutes]) => ({
        date,
        minutes,
        hours: (minutes / 60).toFixed(1)
      }))
    
    res.json({ timeData })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Recommendations
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate('pdf', 'title')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    
    // Find weak topics (< 60% accuracy) with PDF information
    const topicStats = {}
    attempts.forEach(attempt => {
      if (attempt.topic) {
        if (!topicStats[attempt.topic]) {
          topicStats[attempt.topic] = { 
            scores: [], 
            pdfs: new Set(),
            pdfDetails: []
          }
        }
        topicStats[attempt.topic].scores.push(attempt.score || 0)
        if (attempt.pdf) {
          const pdfId = attempt.pdf._id || attempt.pdf
          topicStats[attempt.topic].pdfs.add(pdfId.toString())
          // Store PDF details if available
          if (attempt.pdf.title) {
            topicStats[attempt.topic].pdfDetails.push({
              id: pdfId.toString(),
              title: attempt.pdf.title
            })
          }
        }
      }
    })
    
    const weakTopicsData = Object.entries(topicStats)
      .map(([topic, data]) => ({
        topic,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        attempts: data.scores.length,
        // Get the most recent PDF for this topic
        pdfId: Array.from(data.pdfs)[0],
        pdfTitle: data.pdfDetails.length > 0 ? data.pdfDetails[data.pdfDetails.length - 1].title : null
      }))
      .filter(t => t.avgScore < 60)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 5)
    
    const weakTopics = weakTopicsData.map(t => t.topic)
    
    const recommendations = [
      {
        id: 1,
        type: 'practice',
        title: 'Practice Weak Topics',
        description: weakTopicsData.length > 0 
          ? `Focus on: ${weakTopicsData[0].topic}`
          : 'Keep up the great work!',
        action: 'Generate Quiz',
        icon: '🧩',
        weakestTopic: weakTopicsData.length > 0 ? weakTopicsData[0] : null
      },
      {
        id: 2,
        type: 'revise',
        title: 'Revise from Top PDFs',
        description: 'Review your most studied materials',
        action: 'View Library',
        icon: '📘'
      },
      {
        id: 3,
        type: 'custom',
        title: 'Generate Custom Quiz',
        description: 'Create a personalized quiz from your weak areas',
        action: 'Create Quiz',
        icon: '⚡'
      },
      {
        id: 4,
        type: 'video',
        title: 'Watch Suggested Videos',
        description: 'Learn from related educational content',
        action: 'Browse Videos',
        icon: '🎥'
      }
    ]
    
    res.json({ recommendations, weakTopics, weakTopicsData })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
