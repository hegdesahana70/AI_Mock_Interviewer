const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generate Questions dynamically based on role and difficulty
async function generateAIQuestions(role, difficulty) {
  const modelName = 'gemini-3.5-flash';
  const response = await ai.models.generateContent({
    model: modelName,
    contents: `Generate 3 technical interview questions for a ${difficulty} level ${role}. Return the response strictly as a JSON array of strings, with no extra markdown formatting or text.`,
  });
  
  let text = response.text.trim();
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

  const modelName = 'gemini-3.5-flash';
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  let text = response.text.trim();
  if (text.startsWith('```json')) text = text.slice(7);
  if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  return JSON.parse(text.trim());
}

module.exports = { generateAIQuestions, evaluateAIPerformance };