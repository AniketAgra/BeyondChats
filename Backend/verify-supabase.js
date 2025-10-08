// Quick diagnostic script to check Supabase configuration
import { ensureClient, getBucket } from './src/config/supabase.js'

console.log('=== Supabase Startup Verification ===\n')

try {
  const client = ensureClient()
  const bucket = getBucket()
  
  console.log('Testing bucket access...')
  const { data, error } = await client.storage.from(bucket).list('', { limit: 1 })
  
  if (error) {
    console.error('❌ ERROR:', error.message)
    console.error('\nTroubleshooting:')
    console.error(`1. Go to: https://supabase.com/dashboard/project/ubualxgfudhmtozwfamn/storage/buckets`)
    console.error(`2. Ensure bucket "${bucket}" exists`)
    console.error('3. Check bucket policies allow service_role access')
    console.error('4. Verify SUPABASE_SERVICE_ROLE_KEY in .env is correct')
    process.exit(1)
  }
  
  console.log('✅ All checks passed!')
  console.log(`✓ Bucket "${bucket}" is accessible`)
  console.log(`✓ Found ${data.length} items in root`)
  
} catch (error) {
  console.error('❌ FATAL ERROR:', error.message)
  console.error(error)
  process.exit(1)
}
