const fs = require('fs');
const path = require('path');
const https = require('https');

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

function testTranslateMode(audioBuffer, fileName, languageCode) {
  return new Promise((resolve, reject) => {
    const boundary = '----CraftNestSarvamBoundary' + Math.random().toString(36).substring(2);

    const parts = [];
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: audio/webm\r\n\r\n`
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
      `${languageCode}\r\n`
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
        'api-subscription-key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
        'User-Agent': 'CraftNest/1.0 (NextJS Node Server)'
      }
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: rawData });
      });
    });

    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function runTranslateTest() {
  console.log('Testing Sarvam STT with mode="translate"...');
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

  const result = await testTranslateMode(buffer, 'recording.webm', 'ta-IN');
  console.log('HTTP Status:', result.status);
  console.log('Response Body:', result.body);
}

runTranslateTest();
