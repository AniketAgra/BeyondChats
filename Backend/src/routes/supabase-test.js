import { Router } from 'express'
import { ensureClient, getBucket, uploadBufferToStorage } from '../config/supabase.js'

const router = Router()

// Test endpoint to verify Supabase connection
router.get('/supabase-test', async (req, res) => {
  try {
    console.log('Testing Supabase connection...')
    const client = ensureClient()
    const bucket = getBucket()
    
    console.log('Testing bucket listing...')
    const { data: files, error } = await client.storage
      .from(bucket)
      .list('', { limit: 1 })
    
    if (error) {
      console.error('Supabase test error:', error)
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error 
      })
    }
    
    res.json({ 
      success: true, 
      message: 'Supabase connection working',
      bucket,
      fileCount: files.length
    })
  } catch (error) {
    console.error('Supabase test failed:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    })
  }
})

// Test upload endpoint
router.post('/supabase-upload-test', async (req, res) => {
  try {
    const testBuffer = Buffer.from('Test content ' + Date.now())
    const testPath = `test-uploads/test-${Date.now()}.txt`
    
    console.log('Testing upload to:', testPath)
    const result = await uploadBufferToStorage({
      path: testPath,
      buffer: testBuffer,
      contentType: 'text/plain'
    })
    
    res.json({
      success: true,
      message: 'Upload test successful',
      result
    })
  } catch (error) {
    console.error('Upload test failed:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
})

export default router
