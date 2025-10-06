import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import mime from 'mime-types'
import cloudinary from '../../config/cloudinary.js'

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const userId = req?.user?._id ? String(req.user._id) : 'anonymous'
    return {
      folder: `edulearn_pdfs/${userId}`,
      resource_type: 'raw',
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
      format: 'pdf'
    }
  }
})

function fileFilter(req, file, cb) {
  const ext = mime.extension(file.mimetype)
  if ((ext === 'pdf') || file.originalname.toLowerCase().endsWith('.pdf')) cb(null, true)
  else cb(new Error('Only .pdf files are allowed'))
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } })
