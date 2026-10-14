const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  role: { type: String, required: true },
  difficulty: { type: String, required: true },
  overallScore: { type: Number, required: true },
  metrics: {
    technical: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 }
  },
  performanceReview: { type: String },
  qaPairs: [
    {
      question: String,
      userAnswer: String,
      aiFeedback: String,
      idealAnswer: String,
      score: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);