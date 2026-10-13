const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('⚠️ Warning: MONGO_URI is not set in .env. Database features will be unavailable until configured.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Atlas Connected Successfully!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.warn('⚠️ Server will remain running. Please check your MONGO_URI in .env.');
  }
};

module.exports = connectDB;