const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const parts = trimmed.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
}

const apiKey = env.SARVAM_API_KEY ? env.SARVAM_API_KEY.trim() : '';

async function testMimeTypeNormalization() {
  console.log('Testing Sarvam API with normalized audio/webm MIME type...');

  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const durationSec = 1;
  const numSamples = sampleRate * durationSec;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Simulate browser original type with codecs parameter
  const originalType = 'audio/webm;codecs=opus';
  // Normalize clean MIME type
  const cleanType = 'audio/webm';

  const cleanBlob = new Blob([buffer], { type: cleanType });

  console.log('Diagnostics:', {
    originalType,
    outgoingType: cleanBlob.type,
    outgoingSize: cleanBlob.size
  });

  const formData = new FormData();
  formData.append('file', cleanBlob, 'recording.webm');
  formData.append('model', 'saaras:v3');
  formData.append('language_code', 'ta-IN');
  formData.append('mode', 'transcribe');

  try {
    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'User-Agent': 'CraftNest/1.0 (NextJS)'
      },
      body: formData
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testMimeTypeNormalization();
