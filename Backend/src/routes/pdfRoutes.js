import { Router } from 'express'
import multer from 'multer'
import pdf from 'pdf-parse/lib/pdf-parse.js'
import { requireAuth } from '../middlewares/auth.js'
import Pdf from '../schemas/Pdf.js'
import KeyFeatures from '../schemas/KeyFeatures.js'
import { generateChaptersFromText, generateSummary, generateKeyPoints } from '../services/chapters.service.js'
import { upload as memoryUpload } from '../middlewares/upload.js'
import axios from 'axios'
import mime from 'mime-types'
import { uploadBufferToStorage, getBucket, getSignedUrl } from '../config/supabase.js'

const router = Router()

// Option A (legacy route name preserved): Accepts multipart but now stores via Supabase
router.post('/upload-legacy', requireAuth, memoryUpload.single('pdf'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
		const { originalname, size, buffer } = req.file
		const userId = String(req.user._id)
		const safeBaseName = (originalname || 'document.pdf').replace(/\.[^/.]+$/, '')
			.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 80)
		const publicId = `${Date.now()}-${safeBaseName}`
		const objectPath = `edulearn_pdfs/${userId}/${publicId}.pdf`
		const { publicUrl, path: storedPath } = await uploadBufferToStorage({
			path: objectPath,
			buffer,
			contentType: 'application/pdf',
			upsert: true
		})
		const doc = await Pdf.create({
			user: req.user._id,
			title: (req.body.title || originalname || 'Untitled').replace(/\.pdf$/i, ''),
			author: req.body.author || '',
			imageUrl: req.body.imageUrl || '',
			pdfUrl: publicUrl,
			storagePath: storedPath,
			url: publicUrl, // legacy field
			filename: originalname || `${publicId}.pdf`,
			size,
			chapters: [],
			cloudinaryPublicId: `edulearn_pdfs/${userId}/${publicId}`,
		})
		res.status(201).json({ success: true, pdf: doc })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

// Option B (new): Upload using local multer memory + Cloudinary upload_stream raw, then parse and LLM
// Strict local multer: limit to PDFs and set size limit (50MB default)
const localUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024) },
	fileFilter: (req, file, cb) => {
		const ext = mime.extension(file.mimetype)
		if (ext === 'pdf' || /\.pdf$/i.test(file.originalname || '')) cb(null, true)
		else cb(new Error('Only PDF files are allowed'))
	}
})
router.post('/upload', requireAuth, localUpload.single('pdf'), async (req, res) => {
	try {
		const { file } = req
		if (!file) return res.status(400).json({ error: 'No file uploaded' })

		// 1) Upload to Supabase Storage
		const safeBaseName = (file.originalname || 'document.pdf').replace(/\.[^/.]+$/, '')
			.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 80)
		const publicId = `${Date.now()}-${safeBaseName}`
		const objectPath = `edulearn_pdfs/${String(req.user._id)}/${publicId}.pdf`
		const { publicUrl, path: storedPath } = await uploadBufferToStorage({
			path: objectPath,
			buffer: file.buffer,
			contentType: 'application/pdf',
			upsert: true
		})

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
			pdfUrl: publicUrl,
			storagePath: storedPath,
				url: publicUrl, // legacy compatibility
			filename: file.originalname,
			size: file.size,
				cloudinaryPublicId: `edulearn_pdfs/${String(req.user._id)}/${publicId}`,
			chapters,
			summary,
		})

		// 5) Start async key features generation (don't wait)
		generateKeyFeaturesAsync(pdfText, req.user._id, doc._id).catch(err => {
			console.error('Background key features generation failed:', err)
		})

		return res.status(201).json({ success: true, pdf: doc })
	} catch (e) {
			// Add more details server-side while keeping response generic
			console.error('PDF upload failed:', e?.response?.data || e)
			const msg = e?.message || 'Upload failed'
			// Common upload errors handling
			if (/File size too large|maxFileSize/i.test(msg)) {
				return res.status(413).json({ error: 'File too large' })
			}
			return res.status(500).json({ error: msg })
	}
})

// Option C: Create from an existing PDF URL (e.g., Cloudinary secure_url)
router.post('/from-url', requireAuth, async (req, res) => {
	try {
		const { url, title, author, imageUrl } = req.body || {}
		if (!url || typeof url !== 'string') {
			return res.status(400).json({ error: 'Missing url' })
		}
		const trimmed = url.trim()
		if (!/^https?:\/\//i.test(trimmed)) {
			return res.status(400).json({ error: 'Invalid url' })
		}

		// 1) Fetch the file
		const resp = await axios.get(trimmed, { responseType: 'arraybuffer', timeout: 20000 })
		const contentType = String(resp.headers['content-type'] || '')
		const contentLen = resp.headers['content-length'] ? Number(resp.headers['content-length']) : undefined
		const isPdf = contentType.includes('pdf') || /\.pdf($|[?#])/i.test(trimmed)
		if (!isPdf) {
			return res.status(400).json({ error: 'URL does not point to a PDF' })
		}

		const buffer = Buffer.from(resp.data)

		// 2) Parse with pdf-parse
		let pdfText = ''
		try {
			const data = await pdf(buffer)
			pdfText = data.text || ''
		} catch (e) {
			// Allow continue even if text extraction fails; metadata still saved
		}

		// 3) Chapters & summary
		const chapters = pdfText ? await generateChaptersFromText(pdfText) : []
		let summary = ''
		try { summary = pdfText ? await generateSummary(pdfText) : '' } catch {}

		// Derive filename from URL if possible
		const filenameFromUrl = (() => {
			try {
				const u = new URL(trimmed)
				const last = u.pathname.split('/').filter(Boolean).pop() || ''
				return decodeURIComponent(last || 'document.pdf')
			} catch { return 'document.pdf' }
		})()

		// Maintain legacy field: if URL looks like old Cloudinary, attempt to backfill; otherwise leave undefined
		const cloudinaryPublicId = (() => {
			const m = trimmed.match(/\/upload\/(?:v\d+\/)?([^.#?]+)/)
			return m ? m[1] : undefined
		})()

		// 4) Save
		const doc = await Pdf.create({
			user: req.user._id,
			title: (title || filenameFromUrl).replace(/\.pdf$/i, ''),
			author: author || '',
			imageUrl: imageUrl || '',
			pdfUrl: trimmed,
			url: trimmed, // legacy compatibility
			filename: filenameFromUrl,
			size: Number.isFinite(contentLen) ? contentLen : undefined,
			cloudinaryPublicId,
			chapters,
			summary,
		})

		// 5) Start async key features generation if we have text
		if (pdfText) {
			generateKeyFeaturesAsync(pdfText, req.user._id, doc._id).catch(err => {
				console.error('Background key features generation failed:', err)
			})
		}

		return res.status(201).json({ success: true, pdf: doc })
	} catch (e) {
		const msg = e.response?.status ? `Fetch failed (${e.response.status})` : e.message
		return res.status(500).json({ error: msg })
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
		res.json({ ...doc, id: String(doc._id) })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

// Resolve a direct, retrievable URL for a stored PDF (signed if needed)
router.get('/:id/url', requireAuth, async (req, res) => {
		try {
		const { id } = req.params
		const doc = await Pdf.findOne({ _id: id, user: req.user._id }).lean()
		if (!doc) return res.status(404).json({ error: 'Not found' })

		// Prefer explicit pdfUrl/url if already public
		const url = doc.pdfUrl || doc.url
		if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
			// If using our known supabase bucket public URL, return as-is
			return res.json({ url })
		}

			// If stored as a storage path, generate a signed URL
			let path = doc.storagePath && typeof doc.storagePath === 'string' ? doc.storagePath : undefined
			if (!path) {
				path = typeof url === 'string' && !/^https?:\/\//i.test(url) ? url : undefined
			}
			// Fallback to cloudinaryPublicId field which we repurpose as storage object path
			if (!path && typeof doc.cloudinaryPublicId === 'string' && /edulearn_pdfs\//.test(doc.cloudinaryPublicId)) {
				path = doc.cloudinaryPublicId.endsWith('.pdf') ? doc.cloudinaryPublicId : `${doc.cloudinaryPublicId}.pdf`
			}
		if (path) {
			const signed = await getSignedUrl({ path, expiresIn: 3600 })
			return res.json({ url: signed })
		}

		return res.status(400).json({ error: 'PDF URL not available' })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

// Helper function to generate key features asynchronously
async function generateKeyFeaturesAsync(pdfText, userId, pdfId) {
	try {
		// Create pending key features document
		await KeyFeatures.create({
			user: userId,
			pdfId,
			keyPoints: [],
			status: 'generating'
		}).catch(() => {}) // Ignore if already exists

		// Generate key points
		const keyPoints = await generateKeyPoints(pdfText)

		// Update with results
		await KeyFeatures.findOneAndUpdate(
			{ user: userId, pdfId },
			{ keyPoints, status: 'completed' },
			{ upsert: true }
		)

		console.log(`Key features generated for PDF ${pdfId}`)
	} catch (error) {
		console.error('Key features generation error:', error)
		await KeyFeatures.findOneAndUpdate(
			{ user: userId, pdfId },
			{ status: 'failed' },
			{ upsert: true }
		).catch(() => {})
	}
}

export default router
