const mongoose = require('mongoose');

// Disable buffering so queries fail fast or use fallback instead of hanging for 10 seconds
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('⚠️ Warning: MONGO_URI is not set in .env. Using fast local database fallback.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB Atlas Connected Successfully!');
  } catch (error) {
    console.warn('⚠️ MongoDB Atlas connection notice:', error.message.split('\n')[0]);
    console.warn('💡 Tip: Ask cluster owner to allow IP in Atlas (Network Access -> 0.0.0.0/0). Using local database fallback in the meantime.');
  }
};

module.exports = connectDB;