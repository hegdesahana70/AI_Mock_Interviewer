const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  role: { type: String, required: true },
  difficulty: { type: String, required: true },
  overallScore: { type: Number, required: true },
  performanceReview: { type: String },
  qaPairs: [
    {
      question: String,
      userAnswer: String,
      aiFeedback: String,
      score: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);