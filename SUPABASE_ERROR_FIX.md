# Supabase Storage Error Fix

## Problem
Error: `Unexpected token '<', "<html>\n<h"... is not valid JSON`

This error occurs when Supabase Storage returns an HTML error page instead of JSON. This typically happens due to:

1. **Invalid bucket configuration**
2. **Incorrect permissions**
3. **Network/CORS issues**
4. **Invalid credentials**

## Solution Applied

### 1. Fixed .env Configuration
**Problem**: SUPABASE_URL had quotes which could cause issues
```bash
# Before (WRONG)
SUPABASE_URL='https://ubualxgfudhmtozwfamn.supabase.co'

# After (CORRECT)
SUPABASE_URL=https://ubualxgfudhmtozwfamn.supabase.co
```

### 2. Enhanced Error Handling
Updated `src/config/supabase.js` with:
- Detailed error logging
- JSON parsing error detection
- Bucket verification on startup
- Better error messages for debugging

### 3. Added Diagnostic Tools
Created helper scripts:
- `test-supabase.js` - Comprehensive Supabase connection test
- `verify-supabase.js` - Quick startup verification

## Verification Steps

### 1. Run the test script
```bash
cd Backend
node test-supabase.js
```

Expected output:
```
✓ Client created
✓ Available buckets: BeyondChats
✓ Bucket "BeyondChats" exists
✓ Successfully listed files
✓ Upload successful
✓ Public URL: https://...
✓ Signed URL created
✓ Test file deleted
=== All tests passed! ===
```

### 2. Verify bucket configuration
1. Go to: https://supabase.com/dashboard/project/ubualxgfudhmtozwfamn/storage/buckets
2. Ensure bucket "BeyondChats" exists
3. Check bucket policies:
   - Service role should have full access
   - For public access: Enable "Public bucket" in settings

### 3. Check bucket policies
Go to: https://supabase.com/dashboard/project/ubualxgfudhmtozwfamn/storage/policies

Ensure these policies exist:

#### Allow service_role full access:
```sql
CREATE POLICY "Service role can do anything"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

#### For public uploads (if needed):
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'BeyondChats');
```

#### For public access (if bucket is public):
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'BeyondChats');
```

## Common Issues & Fixes

### Issue: "Bucket not found"
**Solution**: Create the bucket in Supabase Dashboard
1. Go to Storage section
2. Click "New bucket"
3. Name it "BeyondChats"
4. Set public/private as needed

### Issue: "Permission denied"
**Solution**: Check the service role key
1. Go to Settings > API
2. Copy the `service_role` key (not `anon` key!)
3. Update `SUPABASE_SERVICE_ROLE_KEY` in `.env`

### Issue: Still getting HTML responses
**Solution**: 
1. Check if the Supabase URL is correct (should NOT have /auth or /rest at the end)
2. Verify the project is not paused
3. Check Supabase status: https://status.supabase.com/

## Testing the Fix

### Start the server:
```bash
cd Backend
npm start
```

### Check logs for:
```
✓ Supabase client initialized successfully
✓ Using bucket: BeyondChats
✓ Bucket access verified
```

### Test PDF upload:
```bash
curl -X POST http://localhost:4000/api/pdf/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "pdf=@test.pdf"
```

## Monitoring

The enhanced logging will now show:
- Upload attempts with file sizes
- Detailed error messages
- Success confirmations with URLs

Example success log:
```
Uploading to Supabase: BeyondChats/edulearn_pdfs/USER_ID/1234-document.pdf
Buffer size: 524288 bytes
✓ Upload successful: https://ubualxgfudhmtozwfamn.supabase.co/storage/v1/object/public/BeyondChats/...
```

Example error log (if it fails):
```
Supabase upload error: {
  message: 'Bucket not found',
  statusCode: 404,
  error: [Object]
}
```

## Files Modified

1. `Backend/.env` - Removed quotes from SUPABASE_URL
2. `Backend/src/config/supabase.js` - Enhanced error handling
3. `Backend/test-supabase.js` - Added comprehensive test
4. `Backend/verify-supabase.js` - Added quick verification
5. `Backend/src/routes/supabase-test.js` - Added debug endpoints
6. `Backend/src/app.js` - Added test routes (when DEBUG enabled)

## Next Steps

If issues persist:

1. **Check network**: Ensure server can reach Supabase
   ```bash
   curl https://ubualxgfudhmtozwfamn.supabase.co
   ```

2. **Verify credentials**: They might be expired or incorrect

3. **Check Supabase dashboard**: Look for error logs in the dashboard

4. **Contact Supabase support**: If everything looks correct but still fails

## Additional Resources

- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Storage Policies: https://supabase.com/docs/guides/storage/security/access-control
- Troubleshooting: https://supabase.com/docs/guides/storage/troubleshooting
