const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const envPath = path.join(__dirname, '..', '.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      if (parts[0].trim() === 'GEMINI_API_KEY') {
        apiKey = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

if (!apiKey && process.env.GEMINI_API_KEY) {
  apiKey = process.env.GEMINI_API_KEY.trim();
}

console.log("Testing Targeted Gemini Extractions...");

async function generateWithModels(genAI, prompt, schema) {
  const candidateModels = ["gemini-3.6-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
  let lastErr = null;
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json", responseSchema: schema }
      });
      const res = await model.generateContent(prompt);
      return { modelName, data: JSON.parse(res.response.text()) };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function testTargetedExtraction() {
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found!");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Test 1: Quantity Extraction
  try {
    console.log("\n--- Test 1: Targeted Quantity Extraction ---");
    const quantitySchema = {
      type: SchemaType.OBJECT,
      properties: {
        quantity: { type: SchemaType.NUMBER, nullable: true }
      },
      required: ["quantity"]
    };
    const res = await generateWithModels(genAI, "Extract ONLY requested field 'quantity' from transcript: 'I have forty pieces of this artwork.'", quantitySchema);
    console.log(`[SUCCESS model: ${res.modelName}] Quantity Result:`, res.data);
  } catch (e) {
    console.error("Quantity test failed:", e.message);
  }

  // Test 2: Price Extraction
  try {
    console.log("\n--- Test 2: Targeted Price Extraction ---");
    const priceSchema = {
      type: SchemaType.OBJECT,
      properties: {
        price: { type: SchemaType.NUMBER, nullable: true }
      },
      required: ["price"]
    };
    const res = await generateWithModels(genAI, "Extract ONLY requested field 'price' from transcript: 'I want to sell each one for 1200 rupees.'", priceSchema);
    console.log(`[SUCCESS model: ${res.modelName}] Price Result:`, res.data);
  } catch (e) {
    console.error("Price test failed:", e.message);
  }

  // Test 3: Size Extraction
  try {
    console.log("\n--- Test 3: Targeted Size Extraction ---");
    const sizeSchema = {
      type: SchemaType.OBJECT,
      properties: {
        size: { type: SchemaType.STRING, nullable: true },
        sizeStatus: { type: SchemaType.STRING, nullable: true }
      },
      required: ["size"]
    };
    const res = await generateWithModels(genAI, "Extract ONLY requested field 'size' from transcript: 'The painting is approximately 12 by 18 inches.'", sizeSchema);
    console.log(`[SUCCESS model: ${res.modelName}] Size Result:`, res.data);
  } catch (e) {
    console.error("Size test failed:", e.message);
  }
}

testTargetedExtraction();
