import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim()
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const SUPABASE_BUCKET = (process.env.SUPABASE_BUCKET || 'edulearn').trim()

let _client = null
export function ensureClient() {
  if (_client) return _client
  if (!/^https?:\/\//i.test(SUPABASE_URL) || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Backend/.env')
  }
  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  return _client
}

export function getBucket() {
  return SUPABASE_BUCKET
}

export async function uploadBufferToStorage({ bucket = SUPABASE_BUCKET, path, buffer, contentType = 'application/pdf', upsert = true }) {
  if (!path) throw new Error('uploadBufferToStorage: path is required')
  const supabase = ensureClient()
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType, upsert })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { publicUrl: data.publicUrl, path }
}

export function getPublicUrl({ bucket = SUPABASE_BUCKET, path }) {
  const supabase = ensureClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function getSignedUrl({ bucket = SUPABASE_BUCKET, path, expiresIn = 3600 }) {
  if (!path) throw new Error('getSignedUrl: path is required')
  const supabase = ensureClient()
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export default { ensureClient, getBucket, uploadBufferToStorage, getPublicUrl, getSignedUrl }
