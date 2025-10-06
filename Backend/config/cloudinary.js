import dotenv from 'dotenv'
// cloudinary v1 default export exposes v2 under .v2 as well; use .v2 when available
import cloudinaryPkg from 'cloudinary'
const cloudinary = cloudinaryPkg.v2 || cloudinaryPkg

dotenv.config()

// Normalize and validate env
const CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || '').trim()
const API_KEY = (process.env.CLOUDINARY_API_KEY || '').trim()
const API_SECRET = (process.env.CLOUDINARY_API_SECRET || '').trim()

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET
})

// Helpful warning if not configured (avoid leaking secrets)
if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.warn('[cloudinary] Missing configuration. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set in backend environment/.env')
}

export default cloudinary
