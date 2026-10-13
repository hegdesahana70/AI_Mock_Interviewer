const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

async function generateWithFallback(prompt) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      return response.text;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} unavailable, trying fallback...`);
    }
  }
  throw lastError;
}

// Generate Questions dynamically based on role and difficulty
async function generateAIQuestions(role, difficulty) {
  const prompt = `Generate 3 technical interview questions for a ${difficulty} level ${role}. Return the response strictly as a JSON array of strings, with no extra markdown formatting or text.`;
  const raw = await generateWithFallback(prompt);
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.slice(7);
  if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  return JSON.parse(text.trim());
}

// Evaluate user answers and provide scores/feedback
async function evaluateAIPerformance(role, qaPairs) {
  const prompt = `Evaluate the following interview answers for a ${role} role. 
  Q&A Data: ${JSON.stringify(qaPairs)}
  Provide an overall score out of 100, a detailed performance review summary, and individual feedback/scores for each Q&A pair. 
  Return strictly as a JSON object with keys: overallScore (Number), performanceReview (String), and evaluatedQaPairs (Array of objects with question, userAnswer, aiFeedback, score). No markdown code blocks.`;

  const raw = await generateWithFallback(prompt);
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.slice(7);
  if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  return JSON.parse(text.trim());
}

module.exports = { generateAIQuestions, evaluateAIPerformance };