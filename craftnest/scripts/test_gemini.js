const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const envPath = path.join(__dirname, '..', '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const parts = trimmed.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const apiKey = env.GEMINI_API_KEY ? env.GEMINI_API_KEY.trim() : '';

async function testGeminiModels() {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTest = ['gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello in English');
      console.log(`SUCCESS [${modelName}]:`, result.response.text());
      break;
    } catch (err) {
      console.error(`ERROR [${modelName}]:`, err.message);
    }
  }
}

testGeminiModels();
