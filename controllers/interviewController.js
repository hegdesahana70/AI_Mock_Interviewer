const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Interview = require('../models/Interview');
const { generateAIQuestions, evaluateAIPerformance } = require('../services/geminiService');

const DATA_DIR = path.join(__dirname, '../data');
const INTERVIEWS_FILE = path.join(DATA_DIR, 'interviews.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INTERVIEWS_FILE)) {
    fs.writeFileSync(INTERVIEWS_FILE, JSON.stringify([], null, 2));
  }
}

function getLocalInterviews() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(INTERVIEWS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveLocalInterview(item) {
  ensureDataFile();
  const list = getLocalInterviews();
  list.unshift(item);
  fs.writeFileSync(INTERVIEWS_FILE, JSON.stringify(list, null, 2));
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

exports.getQuestions = async (req, res) => {
  try {
    const { role, difficulty } = req.body;
    const questions = await generateAIQuestions(role, difficulty);
    res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error('Gemini question generation error:', error.message);
    res.status(500).json({ success: false, error: 'Gemini AI failed to generate questions: ' + error.message });
  }
};

exports.submitInterview = async (req, res) => {
  try {
    const { userId, role, difficulty, qaPairs } = req.body;

    // Strict evaluation by Google Gemini AI
    const evaluation = await evaluateAIPerformance(role, qaPairs);

    const interviewData = {
      userId: userId || 'anonymous',
      role: role || 'General Interview',
      difficulty: difficulty || 'Intermediate',
      overallScore: Number(evaluation.overallScore) || 0,
      metrics: evaluation.metrics || {
        technical: Number(evaluation.overallScore) || 0,
        communication: Number(evaluation.overallScore) || 0,
        problemSolving: Number(evaluation.overallScore) || 0,
        confidence: Number(evaluation.overallScore) || 0
      },
      performanceReview: evaluation.performanceReview || 'Evaluation completed.',
      qaPairs: evaluation.evaluatedQaPairs || []
    };

    let report = null;

    if (isMongoConnected()) {
      try {
        const newInterview = await Interview.create(interviewData);
        report = newInterview;
        console.log('✅ Interview successfully saved to MongoDB Atlas! Document ID:', newInterview._id);
      } catch (dbErr) {
        console.warn('MongoDB error saving interview, saving to local store:', dbErr.message);
      }
    }

    if (!report) {
      report = {
        _id: `interview-${Date.now()}`,
        ...interviewData,
        createdAt: new Date().toISOString()
      };
      saveLocalInterview(report);
    }

    res.status(201).json({ success: true, message: "Interview saved successfully", report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    if (isMongoConnected()) {
      try {
        let query = {};
        if (userId && userId !== 'undefined' && userId !== 'null' && userId !== 'anonymous') {
          query = { userId };
        }
        const history = await Interview.find(query).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, history });
      } catch (e) {
        console.warn('MongoDB history query error:', e.message);
      }
    }
    const all = getLocalInterviews();
    const history = all.filter(i => !userId || i.userId === userId || userId === 'local-user' || userId === 'anonymous');
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};