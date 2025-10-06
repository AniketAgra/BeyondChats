import multer from 'multer'
import mime from 'mime-types'

// Use in-memory storage; actual persistence handled by Supabase in routes
const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  const ext = mime.extension(file.mimetype)
  if ((ext === 'pdf') || file.originalname.toLowerCase().endsWith('.pdf')) cb(null, true)
  else cb(new Error('Only .pdf files are allowed'))
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024) } })
