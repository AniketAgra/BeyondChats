import { Router } from 'express'
import { upload } from '../middlewares/upload.js'
import { uploadPdf, listPdfs, getPdf } from '../controllers/pdfController.js'

const router = Router()

// Upload a PDF to Cloudinary + DB
router.post('/upload', upload.single('pdf'), uploadPdf)

// List all PDFs from DB
router.get('/', listPdfs)

// Get single PDF by id
router.get('/:id', getPdf)

export default router
