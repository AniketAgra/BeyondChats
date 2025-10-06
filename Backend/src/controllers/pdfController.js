import Pdf from '../schemas/Pdf.js'

export async function uploadPdf(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // multer-storage-cloudinary puts details on req.file
    const { path: url, originalname, size, filename } = req.file
    const publicId = req.file?.filename || req.file?.public_id || filename

    const doc = await Pdf.create({
      user: req.user._id,
      url,
      filename: originalname || filename,
      size,
      uploadedAt: new Date(),
      cloudinaryPublicId: publicId
    })

    return res.status(201).json({
      message: 'PDF uploaded successfully',
  data: {
        id: String(doc._id),
        url: doc.url,
        filename: doc.filename,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        cloudinaryPublicId: doc.cloudinaryPublicId
      }
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export async function listPdfs(req, res) {
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
      cloudinaryPublicId: d.cloudinaryPublicId
    }))
    res.json({ items })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function getPdf(req, res) {
  try {
    const { id } = req.params
    const d = await Pdf.findOne({ _id: id, user: req.user._id }).lean()
    if (!d) return res.status(404).json({ error: 'Not found' })
    res.json({
      id: String(d._id),
      url: d.url,
      filename: d.filename,
      size: d.size,
      uploadedAt: d.uploadedAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      cloudinaryPublicId: d.cloudinaryPublicId
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
