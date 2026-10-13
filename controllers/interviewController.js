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
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitInterview = async (req, res) => {
  try {
    const { userId, role, difficulty, qaPairs } = req.body;

    const evaluation = await evaluateAIPerformance(role, qaPairs);

    let report = {
      _id: `interview-${Date.now()}`,
      userId: userId || 'local-user',
      role,
      difficulty,
      overallScore: evaluation.overallScore,
      performanceReview: evaluation.performanceReview,
      qaPairs: evaluation.evaluatedQaPairs,
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected()) {
      try {
        const newInterview = await Interview.create(report);
        report = newInterview;
      } catch (dbErr) {
        console.warn('MongoDB error saving interview, saving to local store:', dbErr.message);
        saveLocalInterview(report);
      }
    } else {
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
        const history = await Interview.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, history });
      } catch (e) {}
    }
    const all = getLocalInterviews();
    const history = all.filter(i => !userId || i.userId === userId || userId === 'local-user');
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};