const express = require('express');
const router = express.Router();
const { getQuestions, submitInterview, getHistory } = require('../controllers/interviewController');

router.post('/generate', getQuestions);
router.post('/submit', submitInterview);
router.get('/history/:userId', getHistory);

module.exports = router;