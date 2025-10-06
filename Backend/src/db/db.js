import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    console.warn('MONGO_URI not provided; skipping Mongo connection.');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('Mongo connected');
  } catch (err) {
    console.warn('Mongo connection failed, continuing without DB (mock mode):', err.message);
  }
}
