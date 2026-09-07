const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env.local
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

const sarvamKey = env.SARVAM_API_KEY ? env.SARVAM_API_KEY.trim() : '';
const geminiKey = env.GEMINI_API_KEY ? env.GEMINI_API_KEY.trim() : '';

// Helper to make https request
function httpsRequest(options, postBuffer = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    if (postBuffer) req.write(postBuffer);
    req.end();
  });
}

// Step 1: Synthesize real Tamil spoken audio via Sarvam TTS
async function generateTamilSpeechAudio() {
  console.log('--- STEP 1: Generating real spoken Tamil audio sample via Sarvam TTS ---');
  const payload = JSON.stringify({
  text: "வணக்கம், இது கைகளால் செய்யப்பட்ட பாரம்பரிய மதுரை மண் பாண்ட கலைப்பொருள் ஆகும்.",
  language_code: "ta-IN",
  speaker: "kavitha",
  model: "bulbul:v3"
});

  const options = {
    hostname: 'api.sarvam.ai',
    port: 443,
    path: '/text-to-speech',
    method: 'POST',
    headers: {
      'api-subscription-key': sarvamKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const res = await httpsRequest(options, Buffer.from(payload));
  if (res.status !== 200) {
    throw new Error(`TTS failed with status ${res.status}: ${res.body}`);
  }

  const json = JSON.parse(res.body);
  const base64Audio = json.audios[0];
  const audioBuffer = Buffer.from(base64Audio, 'base64');
  console.log('✓ Spoken Tamil audio generated successfully! Size:', audioBuffer.length, 'bytes');
  return audioBuffer;
}

// Step 2: Send Tamil speech audio to Sarvam STT mode="translate"
async function testSarvamTranslate(audioBuffer) {
  console.log('--- STEP 2: Testing Sarvam Saaras v3 STT (mode="translate") ---');
  const boundary = '----CraftNestTestBoundary' + Math.random().toString(36).substring(2);
  const parts = [];

  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="recording.wav"\r\n` +
    `Content-Type: audio/wav\r\n\r\n`
  ));
  parts.push(audioBuffer);
  parts.push(Buffer.from('\r\n'));

  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model"\r\n\r\n` +
    `saaras:v3\r\n`
  ));

  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="language_code"\r\n\r\n` +
    `ta-IN\r\n`
  ));

  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="mode"\r\n\r\n` +
    `translate\r\n`
  ));

  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const bodyBuffer = Buffer.concat(parts);

  const options = {
    hostname: 'api.sarvam.ai',
    port: 443,
    path: '/speech-to-text',
    method: 'POST',
    headers: {
      'api-subscription-key': sarvamKey,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length,
      'User-Agent': 'CraftNest/1.0'
    }
  };

  const res = await httpsRequest(options, bodyBuffer);
  if (res.status !== 200) {
    throw new Error(`STT failed with status ${res.status}: ${res.body}`);
  }

  const json = JSON.parse(res.body);
  console.log('✓ Sarvam STT Translate Response:', json);
  return json.transcript;
}

// Step 3: Test Gemini listing generation with English transcript
async function testGeminiListing(englishTranscript) {
  console.log('--- STEP 3: Testing Gemini Listing Generation with English Transcript ---');
  const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(geminiKey);

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      description: { type: SchemaType.STRING },
      category: { type: SchemaType.STRING },
      suggestedPrice: { type: SchemaType.NUMBER, nullable: true },
      currency: { type: SchemaType.STRING },
      materials: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      colour: { type: SchemaType.STRING, nullable: true },
      dimensions: { type: SchemaType.STRING, nullable: true },
      careInstructions: { type: SchemaType.STRING, nullable: true },
      seoTags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["title", "description", "category", "currency", "materials", "seoTags"]
  };

  const candidateModels = ["gemini-3.6-flash", "gemini-1.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
  let successfulModel = null;
  let listingData = null;

  for (const modelName of candidateModels) {
    try {
      console.log(`Testing Gemini model: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const prompt = `
You are an e-commerce catalog writer for CraftNest, an Indian artisan marketplace.
Artisan Description (English Translation): "${englishTranscript}"
Detected Craft Type: Terracotta Pottery
Category: Pottery & Ceramics

Generate JSON listing in INR. Do not invent dimensions or unmentioned materials.
`;

      const result = await model.generateContent(prompt);
      listingData = JSON.parse(result.response.text());
      successfulModel = modelName;
      console.log(`✓ Gemini succeeded with model [${modelName}]!`);
      break;
    } catch (err) {
      console.log(`Model [${modelName}] error:`, err.message);
    }
  }

  return { successfulModel, listingData };
}

async function runEndToEndVerification() {
  try {
    const audioBuffer = await generateTamilSpeechAudio();
    const englishTranscript = await testSarvamTranslate(audioBuffer);
    console.log('\n===========================================');
    console.log('ACTUAL ENGLISH TRANSCRIPT RECEIVED FROM SARVAM:');
    console.log(`"${englishTranscript}"`);
    console.log('===========================================\n');

    if (!englishTranscript || !englishTranscript.trim()) {
      throw new Error('Sarvam returned an empty transcript!');
    }

    const { successfulModel, listingData } = await testGeminiListing(englishTranscript);
    console.log('\n===========================================');
    console.log('GEMINI MODEL USED:', successfulModel);
    console.log('GENERATED LISTING RECEIVED:');
    console.log(JSON.stringify(listingData, null, 2));
    console.log('===========================================\n');

  } catch (err) {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  }
}

runEndToEndVerification();
