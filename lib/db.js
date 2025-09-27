import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  // Validate MONGODB_URI before attempting connection
  if (!process.env.MONGODB_URI) {
    const error = new Error('MONGODB_URI environment variable is not defined. Please check your environment configuration.');
    console.error('❌ MongoDB configuration error:', error.message);
    console.error('💡 Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
    throw error;
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('🔍 Connection string check:', {
      hasUri: !!process.env.MONGODB_URI,
      uriLength: process.env.MONGODB_URI?.length || 0,
      uriStart: process.env.MONGODB_URI?.substring(0, 20) + '...' || 'undefined'
    });
    throw err;
  }
};

export default connectDB;
