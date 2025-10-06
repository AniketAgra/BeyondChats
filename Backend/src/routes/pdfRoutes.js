import { Router } from 'express'
import { upload } from '../middlewares/upload.js'
import { uploadPdf } from '../controllers/pdfController.js'

const router = Router()

router.post('/upload', upload.single('pdf'), uploadPdf)

export default router
