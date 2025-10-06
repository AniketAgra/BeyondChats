import { Router } from 'express'
import multer from 'multer'
import pdf from 'pdf-parse/lib/pdf-parse.js'
import cloudinary from '../../config/cloudinary.js'
import { requireAuth } from '../middlewares/auth.js'
import Pdf from '../schemas/Pdf.js'
import { generateChaptersFromText, generateSummary } from '../services/ai.service.js'
import { upload as cloudinaryMulterUpload } from '../middlewares/upload.js'

const router = Router()

// Option A (existing): Upload via multer-storage-cloudinary (kept for backward compat)
router.post('/upload-legacy', requireAuth, cloudinaryMulterUpload.single('pdf'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
		const { path: secure_url, originalname, size, filename } = req.file
		const pdfBuffer = null // original buffer not available in this storage

		let pdfText = ''
		// Best effort: cannot parse without buffer; a future improvement could fetch URL and parse
		// Save minimal record
		const doc = await Pdf.create({
			user: req.user._id,
			title: originalname?.replace(/\.pdf$/i, '') || 'Untitled',
			author: req.body.author || '',
			imageUrl: req.body.imageUrl || '',
			pdfUrl: secure_url,
			url: secure_url, // legacy
			filename: originalname || filename,
			size,
			chapters: [],
		})
		res.status(201).json({ success: true, pdf: doc })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

// Option B (new): Upload using local multer memory + Cloudinary upload_stream raw, then parse and LLM
const localUpload = multer({ storage: multer.memoryStorage() })
router.post('/upload', requireAuth, localUpload.single('pdf'), async (req, res) => {
	try {
		const { file } = req
		if (!file) return res.status(400).json({ error: 'No file uploaded' })

		// 1) Upload to Cloudinary (resource_type raw)
		const uploadToCloudinary = (buffer) => new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{ resource_type: 'raw', folder: `edulearn_pdfs/${String(req.user._id)}` },
				(err, result) => (err ? reject(err) : resolve(result))
			)
			stream.end(buffer)
		})
		const cloudRes = await uploadToCloudinary(file.buffer)

		// 2) Extract text with pdf-parse
		const data = await pdf(file.buffer)
		const pdfText = data.text || ''

		// 3) Generate chapters via LLM
		const chapters = await generateChaptersFromText(pdfText)

		// 3b) Optional summary generation (non-blocking but await for now)
		let summary = ''
		try { summary = await generateSummary(pdfText) } catch {}

		// 4) Save to MongoDB using new schema
		const doc = await Pdf.create({
			user: req.user._id,
			title: (req.body.title || file.originalname || 'Untitled').replace(/\.pdf$/i, ''),
			author: req.body.author || '',
			imageUrl: req.body.imageUrl || '',
			pdfUrl: cloudRes.secure_url,
			url: cloudRes.secure_url, // legacy compatibility
			filename: file.originalname,
			size: file.size,
			cloudinaryPublicId: cloudRes.public_id,
			chapters,
			summary,
		})

		return res.status(201).json({ success: true, pdf: doc })
	} catch (e) {
		return res.status(500).json({ error: e.message })
	}
})

// List all PDFs from DB (scoped to current user)
async function listHandler(req, res) {
	try {
		const docs = await Pdf.find({ user: req.user._id }).sort({ createdAt: -1 }).lean()
		const items = docs.map(d => ({
			id: String(d._id),
			url: d.url,
			filename: d.filename,
			size: d.size,
			uploadedAt: d.uploadedAt,
			createdAt: d.createdAt,
			updatedAt: d.updatedAt,
			cloudinaryPublicId: d.cloudinaryPublicId,
			// new fields
			title: d.title,
			author: d.author,
			imageUrl: d.imageUrl,
			pdfUrl: d.pdfUrl,
			chapters: d.chapters,
			summary: d.summary,
		}))
		res.json({ items })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}
router.get('/', requireAuth, listHandler)
router.get('/user', requireAuth, listHandler)

// Get single PDF by id (must belong to current user)
router.get('/:id', requireAuth, async (req, res) => {
	try {
		const { id } = req.params
		const doc = await Pdf.findOne({ _id: id, user: req.user._id }).lean()
		if (!doc) return res.status(404).json({ error: 'Not found' })
		res.json(doc)
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

export default router
