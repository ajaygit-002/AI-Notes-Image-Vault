const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client with API key from .env
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. AI features will fail until configured.');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Expose a configured model instance. Default to gemini-1.5-flash but allow override.
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const model = genAI.getGenerativeModel({ model: modelName });

module.exports = { model };
