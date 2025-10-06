import Pdf from '../schemas/Pdf.js'

export async function uploadPdf(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // multer-storage-cloudinary puts details on req.file
    const { path: url, originalname, size, filename } = req.file
    const publicId = req.file?.filename || req.file?.public_id || filename

    const doc = await Pdf.create({
      url,
      filename: originalname || filename,
      size,
      uploadedAt: new Date(),
      cloudinaryPublicId: publicId
    })

    return res.status(201).json({
      message: 'PDF uploaded successfully',
      data: {
        id: doc._id,
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
