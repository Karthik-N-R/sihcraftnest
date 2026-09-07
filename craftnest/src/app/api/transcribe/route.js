import { NextResponse } from 'next/server';
import https from 'https';

function postSarvamSpeechTranslate(audioBuffer, fileName, languageCode, apiKey) {
  return new Promise((resolve, reject) => {
    const boundary = '----CraftNestSarvamBoundary' + Math.random().toString(36).substring(2);
    
    let cleanMime = 'audio/webm';
    if (fileName.endsWith('.mp4')) cleanMime = 'audio/mp4';
    else if (fileName.endsWith('.wav')) cleanMime = 'audio/wav';
    else if (fileName.endsWith('.ogg')) cleanMime = 'audio/ogg';

    const parts = [];

    // 1. file part
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: ${cleanMime}\r\n\r\n`
    ));
    parts.push(audioBuffer);
    parts.push(Buffer.from('\r\n'));

    // 2. model part (saaras:v3)
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `saaras:v3\r\n`
    ));

    // 3. language_code part (input language spoken by artisan: ta-IN or hi-IN)
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="language_code"\r\n\r\n` +
      `${languageCode}\r\n`
    ));

    // 4. mode part (translate -> directly outputs English translation)
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="mode"\r\n\r\n` +
      `translate\r\n`
    ));

    // End boundary
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

    req.on('error', (err) => {
      reject(err);
    });

    req.write(bodyBuffer);
    req.end();
  });
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio');
    const selectedLanguage = formData.get('language') || 'ta-IN';

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const apiKey = (process.env.SARVAM_API_KEY || '').trim();

    if (!apiKey) {
      console.error('SARVAM_API_KEY is missing or empty in server environment');
      return NextResponse.json({ 
        error: 'SARVAM_API_KEY is missing or empty in server environment (.env.local). Please set SARVAM_API_KEY in .env.local.',
        status: 500
      }, { status: 500 });
    }

    const languageCode = (selectedLanguage === 'ta-IN' || selectedLanguage === 'hi-IN') 
      ? selectedLanguage 
      : 'ta-IN';

    let fileName = 'recording.webm';
    const type = (audio.type || '').toLowerCase();
    if (type.includes('mp4') || type.includes('m4a')) fileName = 'recording.mp4';
    else if (type.includes('wav')) fileName = 'recording.wav';
    else if (type.includes('ogg')) fileName = 'recording.ogg';

    // Buffer raw audio bytes safely
    const arrayBuffer = await audio.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    console.log('Sarvam speech-to-text translation request:', {
      originalType: audio.type,
      audioSize: audioBuffer.length,
      fileName,
      inputLanguage: languageCode,
      mode: 'translate'
    });

    const result = await postSarvamSpeechTranslate(audioBuffer, fileName, languageCode, apiKey);

    if (result.status !== 200) {
      let sarvamError = null;
      try {
        sarvamError = JSON.parse(result.body);
      } catch (e) {
        sarvamError = { detail: result.body };
      }

      const safeMessage = sarvamError?.detail?.message || sarvamError?.message || sarvamError?.detail || sarvamError?.code || result.body || 'Failed to translate spoken audio';
      console.error('Sarvam API response status:', result.status, safeMessage);

      return NextResponse.json({ 
        error: `Sarvam API error (${result.status}): ${safeMessage}`,
        status: result.status,
        sarvamError
      }, { status: result.status });
    }

    const data = JSON.parse(result.body);
    // Sarvam mode="translate" returns English translation in transcript field
    const transcript = (data?.transcript || '').trim();
    const detectedLanguage = data?.language_code || selectedLanguage;

    return NextResponse.json({ 
      transcript, 
      language: detectedLanguage 
    });

  } catch (error) {
    console.error('Transcription route exception:', error.message);
    return NextResponse.json({ 
      error: `An unexpected server error occurred: ${error.message}`,
      status: 500
    }, { status: 500 });
  }
}
