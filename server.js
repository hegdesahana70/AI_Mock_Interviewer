const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

// Connect to Database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);

// Base Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Mock Interviewer Backend is Up and Running!' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});