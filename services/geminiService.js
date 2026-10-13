const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

function withTimeout(promise, ms = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
  ]);
}

async function generateWithFallback(prompt) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: model,
          contents: prompt,
        }),
        12000
      );
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} notice: ${err.message}, trying next model...`);
    }
  }
  throw lastError;
}

function extractJSON(text) {
  let clean = text.trim();
  const match = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) {
    clean = match[0];
  }
  return JSON.parse(clean);
}

// Generate Questions dynamically based on role and difficulty
async function generateAIQuestions(role, difficulty) {
  const prompt = `Generate 3 technical interview questions for a ${difficulty} level ${role}. Return the response strictly as a JSON array of strings, with no extra markdown formatting or text.`;
  const raw = await generateWithFallback(prompt);
  return extractJSON(raw);
}

// Evaluate user answers and provide scores/feedback
async function evaluateAIPerformance(role, qaPairs) {
  const prompt = `Evaluate the following interview answers for a ${role} role. 
  Q&A Data: ${JSON.stringify(qaPairs)}
  Provide an overall score out of 100, a detailed performance review summary, and individual feedback/scores for each Q&A pair. 
  Return strictly as a JSON object with keys: overallScore (Number), performanceReview (String), and evaluatedQaPairs (Array of objects with question, userAnswer, aiFeedback, score). No markdown code blocks.`;

  const raw = await generateWithFallback(prompt);
  return extractJSON(raw);
}

module.exports = { generateAIQuestions, evaluateAIPerformance };