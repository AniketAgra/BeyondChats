import dotenv from 'dotenv'
import cloudinaryPkg from 'cloudinary'
const cloudinary = cloudinaryPkg.v2 || cloudinaryPkg

dotenv.config()

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim()
})

export default cloudinary
