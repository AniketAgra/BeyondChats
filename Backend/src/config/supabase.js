import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim()
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const SUPABASE_BUCKET = (process.env.SUPABASE_BUCKET || 'edulearn').trim()

let _client = null
export function ensureClient() {
  if (_client) return _client
  
  // Validate configuration
  if (!/^https?:\/\//i.test(SUPABASE_URL) || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase configuration error:')
    console.error('SUPABASE_URL:', SUPABASE_URL ? 'Set (hidden)' : 'MISSING')
    console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'MISSING')
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Backend/.env')
  }
  
  try {
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-node'
        }
      }
    })
    console.log('✓ Supabase client initialized successfully')
    console.log('✓ Using bucket:', SUPABASE_BUCKET)
    
    // Verify bucket access (async, don't await to avoid blocking)
    verifyBucketAccess().catch(err => {
      console.warn('⚠ Warning: Could not verify bucket access:', err.message)
    })
    
    return _client
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    throw error
  }
}

async function verifyBucketAccess() {
  try {
    const client = _client
    if (!client) return
    
    const { data, error } = await client.storage.from(SUPABASE_BUCKET).list('', { limit: 1 })
    
    if (error) {
      console.error('⚠ Bucket verification failed:', error.message)
      if (error.message.includes('not found')) {
        console.error(`⚠ Bucket "${SUPABASE_BUCKET}" does not exist!`)
        console.error('Create it at: https://supabase.com/dashboard/project/ubualxgfudhmtozwfamn/storage/buckets')
      }
    } else {
      console.log('✓ Bucket access verified')
    }
  } catch (err) {
    console.error('⚠ Bucket verification error:', err.message)
  }
}

export function getBucket() {
  return SUPABASE_BUCKET
}

export async function uploadBufferToStorage({ bucket = SUPABASE_BUCKET, path, buffer, contentType = 'application/pdf', upsert = true }) {
  if (!path) throw new Error('uploadBufferToStorage: path is required')
  
  try {
    const supabase = ensureClient()
    console.log(`Uploading to Supabase: ${bucket}/${path}`)
    console.log(`Buffer size: ${buffer.length} bytes`)
    
    // Wrap the upload in a try-catch to handle JSON parsing errors
    let uploadResult
    try {
      uploadResult = await supabase.storage.from(bucket).upload(path, buffer, { 
        contentType, 
        upsert,
        cacheControl: '3600'
      })
    } catch (uploadError) {
      console.error('Raw upload error:', uploadError)
      // Check if it's a JSON parsing error (HTML response)
      if (uploadError.message && uploadError.message.includes('is not valid JSON')) {
        throw new Error('Supabase returned HTML instead of JSON. This usually means:\n' +
          '1. The bucket does not exist or has incorrect permissions\n' +
          '2. The Service Role Key is invalid or expired\n' +
          '3. The Supabase project URL is incorrect\n' +
          'Please verify your Supabase configuration in the dashboard.')
      }
      throw uploadError
    }
    
    const { data, error } = uploadResult
    
    if (error) {
      console.error('Supabase upload error:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name,
        error: error
      })
      throw new Error(`Supabase upload failed: ${error.message}`)
    }
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    console.log('✓ Upload successful:', urlData.publicUrl)
    return { publicUrl: urlData.publicUrl, path }
  } catch (error) {
    console.error('Upload buffer to storage failed:')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    throw error
  }
}

export function getPublicUrl({ bucket = SUPABASE_BUCKET, path }) {
  const supabase = ensureClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function getSignedUrl({ bucket = SUPABASE_BUCKET, path, expiresIn = 3600 }) {
  if (!path) throw new Error('getSignedUrl: path is required')
  
  try {
    const supabase = ensureClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
    
    if (error) {
      console.error('Supabase signed URL error:', {
        message: error.message,
        path,
        bucket
      })
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Get signed URL failed:', error)
    throw error
  }
}

export default { ensureClient, getBucket, uploadBufferToStorage, getPublicUrl, getSignedUrl }
