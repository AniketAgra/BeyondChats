import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import KeyFeatures from '../schemas/KeyFeatures.js'
import Pdf from '../schemas/Pdf.js'
import { generateKeyPoints } from '../services/chapters.service.js'
import pdf from 'pdf-parse/lib/pdf-parse.js'
import axios from 'axios'

const router = Router()

// Generate key features for a PDF (async generation)
router.post('/generate/:pdfId', requireAuth, async (req, res) => {
  try {
    const { pdfId } = req.params
    const userId = req.user._id

    // Check if PDF exists and belongs to user
    const pdfDoc = await Pdf.findOne({ _id: pdfId, user: userId })
    if (!pdfDoc) return res.status(404).json({ error: 'PDF not found' })

    // Create or update key features document with 'generating' status
    let keyFeaturesDoc = await KeyFeatures.findOne({ user: userId, pdfId })
    if (!keyFeaturesDoc) {
      keyFeaturesDoc = await KeyFeatures.create({
        user: userId,
        pdfId,
        keyPoints: [],
        status: 'generating'
      })
    } else {
      keyFeaturesDoc.status = 'generating'
      await keyFeaturesDoc.save()
    }

    // Start async generation (don't wait for it)
    generateKeyFeaturesAsync(pdfDoc, userId, pdfId).catch(err => {
      console.error('Key features generation failed:', err)
    })

    res.json({ success: true, status: 'generating', id: keyFeaturesDoc._id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get key features for a PDF
router.get('/:pdfId', requireAuth, async (req, res) => {
  try {
    const { pdfId } = req.params
    const userId = req.user._id

    const keyFeaturesDoc = await KeyFeatures.findOne({ user: userId, pdfId }).lean()
    
    if (!keyFeaturesDoc) {
      return res.json({ status: 'not_found', keyPoints: [] })
    }

    res.json({
      status: keyFeaturesDoc.status,
      keyPoints: keyFeaturesDoc.keyPoints || [],
      createdAt: keyFeaturesDoc.createdAt,
      updatedAt: keyFeaturesDoc.updatedAt
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Helper function to generate key features asynchronously
async function generateKeyFeaturesAsync(pdfDoc, userId, pdfId) {
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

    // Generate key points using AI
    console.log(`📄 Starting key point generation for PDF ${pdfId}`)
    console.log(`📝 PDF text length: ${pdfText.length} characters`)
    
    const keyPoints = await generateKeyPoints(pdfText)
    
    console.log(`🎯 Generated ${keyPoints.length} key points:`, keyPoints)

    // Validate key points before saving
    if (!keyPoints || keyPoints.length === 0) {
      throw new Error('No key points were generated')
    }

    // Update the document with generated key points
    await KeyFeatures.findOneAndUpdate(
      { user: userId, pdfId },
      { 
        keyPoints, 
        status: 'completed' 
      },
      { upsert: true }
    )

    console.log(`✅ Key features generated successfully for PDF ${pdfId}`)
  } catch (error) {
    console.error(`❌ Error generating key features for PDF ${pdfId}:`, error.message)
    console.error('Full error:', error)
    
    // Update status to failed
    await KeyFeatures.findOneAndUpdate(
      { user: userId, pdfId },
      { status: 'failed' },
      { upsert: true }
    )
  }
}

export default router
