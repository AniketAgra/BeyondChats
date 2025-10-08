import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim()
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const SUPABASE_BUCKET = (process.env.SUPABASE_BUCKET || 'BeyondChats').trim()

console.log('=== Testing Supabase Connection ===')
console.log('URL:', SUPABASE_URL || 'NOT SET')
console.log('Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? `${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT SET')
console.log('Bucket:', SUPABASE_BUCKET)
console.log()

async function testConnection() {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file')
    }

    console.log('1. Creating Supabase client...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      }
    })
    console.log('✓ Client created')

    console.log('\n2. Testing bucket access...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('✗ Failed to list buckets:', bucketsError)
      throw bucketsError
    }
    
    console.log('✓ Available buckets:', buckets.map(b => b.name).join(', '))
    
    const bucketExists = buckets.some(b => b.name === SUPABASE_BUCKET)
    if (!bucketExists) {
      console.warn(`⚠ Warning: Bucket "${SUPABASE_BUCKET}" does not exist!`)
      console.log('\nYou need to create the bucket in Supabase Dashboard:')
      console.log('1. Go to: https://supabase.com/dashboard/project/ubualxgfudhmtozwfamn/storage/buckets')
      console.log(`2. Create a new bucket named: ${SUPABASE_BUCKET}`)
      console.log('3. Make it public if you want direct access, or keep private for signed URLs')
      return
    }
    
    console.log(`✓ Bucket "${SUPABASE_BUCKET}" exists`)

    console.log('\n3. Testing bucket listing...')
    const { data: files, error: listError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list('', { limit: 5 })
    
    if (listError) {
      console.error('✗ Failed to list files:', listError)
      throw listError
    }
    
    console.log('✓ Successfully listed files:', files.length, 'items found')

    console.log('\n4. Testing file upload...')
    const testContent = Buffer.from('Test file content')
    const testPath = `test/${Date.now()}-test.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (uploadError) {
      console.error('✗ Upload failed:', uploadError)
      throw uploadError
    }
    
    console.log('✓ Upload successful:', uploadData.path)

    console.log('\n5. Getting public URL...')
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(testPath)
    
    console.log('✓ Public URL:', urlData.publicUrl)

    console.log('\n6. Getting signed URL...')
    const { data: signedData, error: signedError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(testPath, 3600)
    
    if (signedError) {
      console.error('✗ Failed to create signed URL:', signedError)
    } else {
      console.log('✓ Signed URL created:', signedData.signedUrl.substring(0, 80) + '...')
    }

    console.log('\n7. Cleaning up test file...')
    const { error: deleteError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove([testPath])
    
    if (deleteError) {
      console.warn('⚠ Failed to delete test file:', deleteError)
    } else {
      console.log('✓ Test file deleted')
    }

    console.log('\n=== All tests passed! ===')
    console.log('Supabase Storage is working correctly.')
    
  } catch (error) {
    console.error('\n=== Test failed ===')
    console.error('Error:', error.message)
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode)
    }
    console.error('\nFull error:', error)
    process.exit(1)
  }
}

testConnection()
