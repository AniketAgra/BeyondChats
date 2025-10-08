import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import Topic from '../schemas/Topic.js'
import TopicPerformance from '../schemas/TopicPerformance.js'
import Pdf from '../schemas/Pdf.js'
import { generateTopicsFromText } from '../services/topicService.js'
import pdf from 'pdf-parse/lib/pdf-parse.js'
import axios from 'axios'

const router = Router()

// Generate topics for a PDF (async generation)
router.post('/generate/:pdfId', requireAuth, async (req, res) => {
  try {
    const { pdfId } = req.params
    const userId = req.user._id

    // Check if PDF exists and belongs to user
    const pdfDoc = await Pdf.findOne({ _id: pdfId, user: userId })
    if (!pdfDoc) return res.status(404).json({ error: 'PDF not found' })

    // Create or update topic document with 'generating' status
    let topicDoc = await Topic.findOne({ user: userId, pdf: pdfId })
    if (!topicDoc) {
      topicDoc = await Topic.create({
        user: userId,
        pdf: pdfId,
        mainTopic: '',
        subtopics: [],
        status: 'generating'
      })
    } else {
      topicDoc.status = 'generating'
      await topicDoc.save()
    }

    // Start async generation (don't wait for it)
    generateTopicsAsync(pdfDoc, userId, pdfId).catch(err => {
      console.error('Topics generation failed:', err)
    })

    res.json({ success: true, status: 'generating', id: topicDoc._id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get topics for a PDF
router.get('/:pdfId', requireAuth, async (req, res) => {
  try {
    const { pdfId } = req.params
    const userId = req.user._id

    const topicDoc = await Topic.findOne({ user: userId, pdf: pdfId }).lean()
    
    if (!topicDoc) {
      return res.json({ status: 'not_found', mainTopic: '', subtopics: [] })
    }

    res.json({
      status: topicDoc.status,
      mainTopic: topicDoc.mainTopic || '',
      subtopics: topicDoc.subtopics || [],
      createdAt: topicDoc.createdAt,
      updatedAt: topicDoc.updatedAt
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get topic performance for a PDF (weak/strong topics)
router.get('/performance/:pdfId', requireAuth, async (req, res) => {
  try {
    const { pdfId } = req.params
    const userId = req.user._id

    const performances = await TopicPerformance.find({ 
      user: userId, 
      pdf: pdfId 
    })
    .sort({ accuracy: 1 }) // Sort by accuracy ascending (weak first)
    .lean()

    const weakTopics = performances.filter(p => p.category === 'weak')
    const strongTopics = performances.filter(p => p.category === 'strong')
    const moderateTopics = performances.filter(p => p.category === 'moderate')

    res.json({
      weakTopics: weakTopics.map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        totalQuestions: t.totalQuestions,
        correctAnswers: t.correctAnswers,
        incorrectAnswers: t.incorrectAnswers
      })),
      strongTopics: strongTopics.map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        totalQuestions: t.totalQuestions,
        correctAnswers: t.correctAnswers,
        incorrectAnswers: t.incorrectAnswers
      })),
      moderateTopics: moderateTopics.map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        totalQuestions: t.totalQuestions,
        correctAnswers: t.correctAnswers,
        incorrectAnswers: t.incorrectAnswers
      })),
      allPerformances: performances.map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        category: t.category,
        totalQuestions: t.totalQuestions,
        correctAnswers: t.correctAnswers,
        incorrectAnswers: t.incorrectAnswers,
        lastAttemptDate: t.lastAttemptDate
      }))
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get overall topic performance across all PDFs for dashboard
router.get('/performance/dashboard/all', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id

    const performances = await TopicPerformance.find({ user: userId })
      .populate('pdf', 'title')
      .sort({ accuracy: 1 })
      .lean()

    // Aggregate by topic name (across all PDFs)
    const topicAggregation = {}
    performances.forEach(p => {
      if (!topicAggregation[p.topic]) {
        topicAggregation[p.topic] = {
          topic: p.topic,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          pdfCount: 0,
          pdfs: []
        }
      }
      
      topicAggregation[p.topic].totalQuestions += p.totalQuestions
      topicAggregation[p.topic].correctAnswers += p.correctAnswers
      topicAggregation[p.topic].incorrectAnswers += p.incorrectAnswers
      topicAggregation[p.topic].pdfCount += 1
      if (p.pdf) {
        topicAggregation[p.topic].pdfs.push(p.pdf.title || 'Untitled')
      }
    })

    // Calculate accuracy and categorize
    const aggregatedTopics = Object.values(topicAggregation).map(t => {
      const accuracy = t.totalQuestions > 0 
        ? Math.round((t.correctAnswers / t.totalQuestions) * 100) 
        : 0
      
      let category = 'not-attempted'
      if (accuracy >= 80) category = 'strong'
      else if (accuracy >= 60) category = 'moderate'
      else if (t.totalQuestions > 0) category = 'weak'
      
      return {
        ...t,
        accuracy,
        category
      }
    })

    const weakTopics = aggregatedTopics.filter(t => t.category === 'weak').slice(0, 10)
    const strongTopics = aggregatedTopics.filter(t => t.category === 'strong').slice(0, 10)

    res.json({
      weakTopics,
      strongTopics,
      allTopics: aggregatedTopics,
      totalTopicsCovered: aggregatedTopics.length,
      totalQuestionsAnswered: aggregatedTopics.reduce((sum, t) => sum + t.totalQuestions, 0)
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Helper function to generate topics asynchronously
async function generateTopicsAsync(pdfDoc, userId, pdfId) {
  try {
    // Fetch PDF content
    const pdfUrl = pdfDoc.pdfUrl || pdfDoc.url
    if (!pdfUrl) {
      throw new Error('PDF URL not found')
    }

    let pdfText = ''
    
    // Download and parse PDF
    const response = await axios.get(pdfUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000 
    })
    const buffer = Buffer.from(response.data)
    const data = await pdf(buffer)
    pdfText = data.text || ''

    // Generate topics using AI
    const { mainTopic, subtopics } = await generateTopicsFromText(pdfText, pdfDoc.title)

    // Update the document with generated topics
    await Topic.findOneAndUpdate(
      { user: userId, pdf: pdfId },
      { 
        mainTopic,
        subtopics,
        status: 'completed',
        confidence: 1
      },
      { upsert: true }
    )

    console.log(`Topics generated successfully for PDF ${pdfId}: ${mainTopic}`)
  } catch (error) {
    console.error('Error generating topics:', error)
    
    // Update status to failed
    await Topic.findOneAndUpdate(
      { user: userId, pdf: pdfId },
      { status: 'failed' },
      { upsert: true }
    )
  }
}

export default router
