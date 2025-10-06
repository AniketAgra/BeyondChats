import dotenv from 'dotenv'
import cloudinaryPkg from 'cloudinary'
const cloudinary = cloudinaryPkg.v2 || cloudinaryPkg

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export default cloudinary
