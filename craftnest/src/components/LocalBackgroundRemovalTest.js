'use client';

import { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';

function analyzeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');

      const maxSize = 600;
      const scale = Math.min(
        1,
        maxSize / Math.max(img.width, img.height)
      );

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d', {
        willReadFrequently: true
      });

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const { data, width, height } =
        ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

      let brightnessTotal = 0;
      let brightnessSquared = 0;
      let darkPixels = 0;
      let brightPixels = 0;

      // Analyze brightness and contrast
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const brightness =
          0.299 * r +
          0.587 * g +
          0.114 * b;

        brightnessTotal += brightness;
        brightnessSquared += brightness * brightness;

        if (brightness < 35) {
          darkPixels++;
        }

        if (brightness > 245) {
          brightPixels++;
        }
      }

      const pixelCount = data.length / 4;

      const averageBrightness =
        brightnessTotal / pixelCount;

      const variance =
        brightnessSquared / pixelCount -
        averageBrightness * averageBrightness;

      const contrast = Math.sqrt(
        Math.max(variance, 0)
      );

      const darkRatio =
        darkPixels / pixelCount;

      const brightRatio =
        brightPixels / pixelCount;

      // Basic composition checks
      const aspectRatio = width / height;

      let score = 100;

      // Very dark image
      if (averageBrightness < 55) {
        score -= 25;
      } else if (averageBrightness < 75) {
        score -= 12;
      }

      // Very bright / washed out image
      if (averageBrightness > 225) {
        score -= 20;
      }

      // Very low contrast
      if (contrast < 25) {
        score -= 20;
      } else if (contrast < 40) {
        score -= 8;
      }

      // Extremely dark image
      if (darkRatio > 0.65) {
        score -= 15;
      }

      // Extremely washed out image
      if (brightRatio > 0.75) {
        score -= 15;
      }

      // Very tiny / low resolution image
      if (img.width < 500 || img.height < 500) {
        score -= 10;
      }

      score = Math.max(
        0,
        Math.min(100, Math.round(score))
      );

      URL.revokeObjectURL(url);

      resolve({
        score,
        width: img.width,
        height: img.height,
        averageBrightness: Math.round(
          averageBrightness
        ),
        contrast: Math.round(contrast)
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error('Could not analyze image.')
      );
    };

    img.src = url;
  });
}

export default function LocalBackgroundRemovalTest() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleImage = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(URL.createObjectURL(file));
    setResult(null);
    setAnalysis(null);
    setError('');
    setProcessing(true);

    try {
      console.log('Analyzing image locally...');

      const quality = await analyzeImage(file);

      console.log(
        'Local image analysis:',
        quality
      );

      setAnalysis(quality);

      /*
       * IMPORTANT:
       *
       * We intentionally do NOT run background
       * removal yet.
       *
       * For now we are only testing whether
       * the image needs enhancement.
       */

      if (quality.score >= 80) {
        console.log(
          'Image already looks good. Keeping original.'
        );

        setResult('ORIGINAL_GOOD');

        return;
      }

      console.log(
        'Image may need enhancement.'
      );

      // TEMPORARY:
      // We will connect the local AI background
      // removal here after testing the analyzer.
      setResult('NEEDS_ENHANCEMENT');

    } catch (err) {
      console.error(
        'Image analysis failed:',
        err
      );

      setError(
        err?.message ||
        'Image analysis failed.'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      style={{
        padding: '30px',
        maxWidth: '1100px',
        margin: 'auto'
      }}
    >
      <h1>
        CraftNest Smart Image Analyzer
      </h1>

      <p>
        Local AI-assisted image quality check
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleImage}
      />

      {processing && (
        <p>
          🧠 Analyzing image locally...
        </p>
      )}

      {error && (
        <p style={{ color: 'red' }}>
          ❌ {error}
        </p>
      )}

      {analysis && (
        <div
          style={{
            marginTop: '25px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '12px'
          }}
        >
          <h2>
            Image Analysis
          </h2>

          <p>
            <strong>Quality Score:</strong>{' '}
            {analysis.score}/100
          </p>

          <p>
            <strong>Brightness:</strong>{' '}
            {analysis.averageBrightness}
          </p>

          <p>
            <strong>Contrast:</strong>{' '}
            {analysis.contrast}
          </p>

          <p>
            <strong>Resolution:</strong>{' '}
            {analysis.width} × {analysis.height}
          </p>

          {result === 'ORIGINAL_GOOD' && (
            <h3 style={{ color: 'green' }}>
              ✅ Enhancement not required — original
              preserved
            </h3>
          )}

          {result === 'NEEDS_ENHANCEMENT' && (
            <h3 style={{ color: '#c75b39' }}>
              🛠️ This image may need enhancement
            </h3>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '30px',
          marginTop: '30px',
          flexWrap: 'wrap'
        }}
      >
        {image && (
          <div>
            <h3>Original</h3>

            <img
              src={image}
              alt="Original"
              style={{
                maxWidth: '450px',
                maxHeight: '500px'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}