const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

function withTimeout(promise, ms = 25000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), ms))
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
        25000
      );
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} note: ${err.message}, trying next model...`);
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

// Generate Questions strictly and dynamically from Gemini AI
async function generateAIQuestions(role, difficulty) {
  const prompt = `You are an expert technical interviewer. Generate 3 unique and challenging technical interview questions for a candidate applying for a ${difficulty} level ${role} role. Return ONLY a valid JSON array of strings containing the questions, without any markdown formatting or extra text. Example format: ["Question 1", "Question 2", "Question 3"]`;
  const raw = await generateWithFallback(prompt);
  return extractJSON(raw);
}

// Evaluate candidate answers dynamically with Gemini AI
async function evaluateAIPerformance(role, qaPairs) {
  const prompt = `You are an expert technical hiring manager evaluating an interview for a ${role} position.
Candidate Responses:
${JSON.stringify(qaPairs, null, 2)}

Provide a strict, professional evaluation and return ONLY a valid JSON object with the following schema:
{
  "overallScore": <number between 0 and 100 based on answer accuracy and completeness>,
  "metrics": {
    "technical": <number between 0 and 100 reflecting depth of technical domain knowledge>,
    "communication": <number between 0 and 100 reflecting clarity, structure, and conciseness>,
    "problemSolving": <number between 0 and 100 reflecting analytical reasoning and edge case handling>,
    "confidence": <number between 0 and 100 reflecting professional tone, assertiveness, and completeness>
  },
  "performanceReview": "<A comprehensive, tailored paragraph reviewing the candidate's performance, strengths, and specific areas for technical growth>",
  "evaluatedQaPairs": [
    {
      "question": "<the question>",
      "userAnswer": "<the candidate's answer>",
      "aiFeedback": "<specific, actionable feedback on this individual answer>",
      "idealAnswer": "<a comprehensive, technically precise model answer detailing the exact concepts, key terms, and architecture that an interviewer expects for this question>",
      "score": <score from 0 to 100 for this answer>
    }
  ]
}
Return strictly the JSON object with no markdown backticks.`;

  const raw = await generateWithFallback(prompt);
  return extractJSON(raw);
}

module.exports = { generateAIQuestions, evaluateAIPerformance };