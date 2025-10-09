# 🗄️ Supabase Storage Service

## Overview

EduLearn uses **Supabase Storage** for secure, scalable PDF file storage. All uploaded PDFs are stored in Supabase buckets and accessed via signed URLs.

---

## 🔧 Configuration

### Setup

**File:** `Backend/src/config/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=edulearn-pdfs
```

**⚠️ Important:** Use `service_role` key, NOT `anon` key for server-side uploads.

---

## 📦 Bucket Setup

### Creating the Bucket

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name: `edulearn-pdfs`
4. Public access: **No** (use signed URLs)
5. File size limit: 50 MB
6. Allowed MIME types: `application/pdf`

### Bucket Policies

```sql
-- Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'edulearn-pdfs');

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'edulearn-pdfs' AND auth.uid()::text = owner);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'edulearn-pdfs' AND auth.uid()::text = owner);
```

---

## 🔄 Upload Flow

### Backend Implementation

**File:** `Backend/src/routes/pdfRoutes.js`

```javascript
import { supabase } from '../config/supabase.js';

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;
    const fileName = `${userId}/${Date.now()}_${file.originalname}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUrl(fileName, 31536000); // 1 year in seconds

    const signedUrl = urlData.signedUrl;

    // Extract text from PDF
    const pdfText = await pdfParse(file.buffer);

    // Generate AI summary
    const summary = await generateSummary(pdfText.text);

    // Save to MongoDB
    const pdfDoc = await Pdf.create({
      user: userId,
      url: signedUrl,
      filename: file.originalname,
      title: req.body.title || file.originalname,
      size: file.size,
      summary: summary,
      uploadedAt: new Date()
    });

    res.status(201).json({ success: true, pdf: pdfDoc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔑 Signed URLs

### Why Signed URLs?

- **Security:** Only authorized users can access
- **Time-Limited:** URLs expire after set duration
- **No Direct Bucket Access:** Prevents unauthorized downloads

### Generating Signed URLs

```javascript
// 1 hour expiry
const { data, error } = await supabase.storage
  .from('edulearn-pdfs')
  .createSignedUrl('path/to/file.pdf', 3600);

const signedUrl = data.signedUrl;
```

### Refreshing Expired URLs

If URL expires, regenerate:

```javascript
async function refreshPdfUrl(pdfDoc) {
  const fileName = extractFileName(pdfDoc.url); // Get original path
  
  const { data } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .createSignedUrl(fileName, 31536000);
  
  // Update MongoDB with new URL
  await Pdf.updateOne(
    { _id: pdfDoc._id },
    { url: data.signedUrl }
  );
  
  return data.signedUrl;
}
```

---

## 🗑️ Deletion

### Delete File from Supabase

```javascript
router.delete('/:id', requireAuth, async (req, res) => {
  const pdfDoc = await Pdf.findOne({ _id: req.params.id, user: req.user._id });
  
  if (!pdfDoc) {
    return res.status(404).json({ error: 'PDF not found' });
  }

  // Extract file path from signed URL
  const filePath = extractFilePath(pdfDoc.url);

  // Delete from Supabase Storage
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Supabase deletion error:', error);
  }

  // Delete from MongoDB
  await Pdf.deleteOne({ _id: pdfDoc._id });

  res.json({ message: 'PDF deleted successfully' });
});
```

---

## 📊 File Organization

### Directory Structure in Bucket

```
edulearn-pdfs/
├── user123/
│   ├── 1696000000000_physics_xi.pdf
│   ├── 1696000001000_chemistry_xi.pdf
│   └── 1696000002000_math_xi.pdf
├── user456/
│   ├── 1696000003000_biology_xi.pdf
│   └── 1696000004000_history.pdf
```

**Benefits:**
- User isolation
- Easy cleanup
- Organized structure

---

## 🔐 Security Best Practices

### 1. Use Service Role Key on Server

```javascript
// ✅ Correct: Server-side with service_role key
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
```

```javascript
// ❌ Wrong: Never use service_role key in frontend
const supabase = createClient(url, anonKey); // Frontend
```

### 2. Validate File Types

```javascript
const allowedTypes = ['application/pdf'];

if (!allowedTypes.includes(file.mimetype)) {
  return res.status(400).json({ error: 'Only PDF files allowed' });
}
```

### 3. Limit File Size

```javascript
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

if (file.size > MAX_SIZE) {
  return res.status(400).json({ error: 'File too large (max 50MB)' });
}
```

### 4. Sanitize Filenames

```javascript
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
};
```

---

## 📈 Performance Optimization

### 1. Caching Headers

```javascript
await supabase.storage
  .from(bucket)
  .upload(fileName, buffer, {
    cacheControl: '3600', // Cache for 1 hour
    contentType: 'application/pdf'
  });
```

### 2. Lazy Loading PDFs

Frontend loads PDF incrementally:

```javascript
<Document
  file={{ url: pdfUrl }}
  loading={<SkeletonLoader />}
  onLoadSuccess={onDocumentLoad}
/>
```

### 3. Thumbnail Generation

Future enhancement: Generate PDF thumbnails for library view.

---

## 🐛 Common Issues

### Issue: Upload Fails with 401

**Cause:** Using `anon` key instead of `service_role` key

**Solution:** Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env`

---

### Issue: Signed URL Expired

**Cause:** URL validity period ended

**Solution:** Implement URL refresh logic before serving to frontend

---

### Issue: CORS Error

**Cause:** Supabase bucket not allowing frontend origin

**Solution:** Add frontend URL to allowed origins in Supabase settings

---

## 📊 Monitoring & Analytics

### Storage Usage

Check Supabase Dashboard → Storage → Usage

- Total storage used
- Number of files
- Bandwidth usage

### Alerts

Set up alerts for:
- Storage approaching quota
- High bandwidth usage
- Failed uploads

---

## 🔗 Alternative Storage Options

### AWS S3

Replace Supabase with S3:

```javascript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

const params = {
  Bucket: 'edulearn-pdfs',
  Key: fileName,
  Body: fileBuffer,
  ContentType: 'application/pdf'
};

await s3.upload(params).promise();
```

### Cloudinary

For PDFs with preview images:

```javascript
import cloudinary from 'cloudinary';

const result = await cloudinary.uploader.upload(filePath, {
  resource_type: 'raw',
  format: 'pdf'
});
```

---

## 📚 Related Documentation

- [PDF Upload Flow](../pages/page_pdf_viewer.md)
- [API Endpoints - PDF](../api/api_endpoints.md#pdf-endpoints)
- [System Architecture](../overview/02_System_Architecture.md)

---

**Developer Notes:**
- Consider implementing CDN for faster PDF delivery
- Add virus scanning before upload (future)
- Implement progressive upload for large files
- Add PDF compression to reduce storage costs

---

**Last Updated:** October 2025  
**Version:** 1.0.0
