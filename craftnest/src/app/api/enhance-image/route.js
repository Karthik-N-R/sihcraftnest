import { NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';

export async function POST(req) {
  try {
    const apiKey = (process.env.HF_API_KEY || '').trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'HF_API_KEY is missing from .env.local' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'No image was provided.' },
        { status: 400 }
      );
    }

    let base64Data = image;
    let mimeType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');

      if (parts.length !== 2) {
        return NextResponse.json(
          { error: 'Invalid image data.' },
          { status: 400 }
        );
      }

      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      base64Data = parts[1];
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');

    const imageBlob = new Blob(
      [imageBuffer],
      { type: mimeType }
    );

    const client = new InferenceClient(apiKey);

    console.log('Calling RMBG-2.0...');

    const result = await client.imageSegmentation({
      model: 'briaai/RMBG-2.0',
      provider: 'fal-ai',
      inputs: imageBlob
    });

    console.log('RMBG response:', result);

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('RMBG returned no segmentation result.');
    }

    const firstResult = result[0];

    if (!firstResult.mask) {
      throw new Error('RMBG returned no mask.');
    }

    let maskBase64 = firstResult.mask;

    // In case the provider already includes a data URL prefix
    if (maskBase64.startsWith('data:')) {
      maskBase64 = maskBase64.split(';base64,')[1];
    }

    return NextResponse.json({
      enhancedImage: `data:image/png;base64,${maskBase64}`,
      score: firstResult.score,
      label: firstResult.label
    });

  } catch (error) {
    console.error(
      'Hugging Face background removal error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Background removal failed.'
      },
      { status: 500 }
    );
  }
}