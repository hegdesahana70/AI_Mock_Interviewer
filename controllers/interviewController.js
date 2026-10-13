const Interview = require('../models/Interview');
const { generateAIQuestions, evaluateAIPerformance } = require('../services/geminiService');

exports.getQuestions = async (req, res) => {
  try {
    const { role, difficulty } = req.body;
    const questions = await generateAIQuestions(role, difficulty);
    res.status(200).json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitInterview = async (req, res) => {
  try {
    const { userId, role, difficulty, qaPairs } = req.body;

    const evaluation = await evaluateAIPerformance(role, qaPairs);

    const newInterview = await Interview.create({
      userId,
      role,
      difficulty,
      overallScore: evaluation.overallScore,
      performanceReview: evaluation.performanceReview,
      qaPairs: evaluation.evaluatedQaPairs
    });

    res.status(201).json({ success: true, message: "Interview saved successfully", report: newInterview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await Interview.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};