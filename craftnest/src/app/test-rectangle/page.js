'use client';

import { useState } from 'react';

export default function TestRectanglePage() {
  const [image, setImage] = useState(null);
  const [corners, setCorners] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [accepted, setAccepted] = useState(null);
  const [hint, setHint] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleImage = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setCorners(null);
    setConfidence(null);
    setAccepted(null);
    setHint('');
    setError('');
    setProcessing(true);

    try {
      console.log('Loading local detection libraries...');

      // Load the libraries only in the browser.
      const cvModule = await import('@techstark/opencv-js');
      const snapModule = await import('@snap-smart/core');

      const cvReadyPromise = cvModule.default;

      await cvReadyPromise;

      const suggestCornersFromImage =
        snapModule.suggestCornersFromImage;

      console.log('OpenCV ready.');
      console.log('Detecting rectangle...');

      const img = new Image();

      img.onload = async () => {
        try {
          const result = await suggestCornersFromImage(img, {
            debugConsole: true
          });

          console.log(
            'Corner detection result:',
            result
          );

          setAccepted(result?.accepted ?? false);
          setConfidence(result?.confidence ?? null);
          setCorners(result?.corners || null);
          setHint(result?.hint || '');

        } catch (err) {
          console.error(
            'Corner detection failed:',
            err
          );

          setError(
            err?.message ||
            'Could not detect the product rectangle.'
          );
        } finally {
          setProcessing(false);
        }
      };

      img.onerror = () => {
        setError('Could not load the image.');
        setProcessing(false);
      };

      img.src = imageUrl;

    } catch (err) {
      console.error(
        'Detection initialization failed:',
        err
      );

      setError(
        err?.message ||
        'Could not initialize rectangle detection.'
      );

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
        CraftNest Product Rectangle Detector
      </h1>

      <p>
        Local corner detection — no cropping yet.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleImage}
      />

      {processing && (
        <p>
          🔍 Looking for a rectangular
          painting/product...
        </p>
      )}

      {error && (
        <p style={{ color: 'red' }}>
          ❌ {error}
        </p>
      )}

      {confidence !== null && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '10px'
          }}
        >
          <strong>
            Detection confidence:
          </strong>{' '}
          {Math.round(confidence * 100)}%
        </div>
      )}

      {accepted === true && (
        <div
          style={{
            marginTop: '15px',
            padding: '15px',
            borderRadius: '10px',
            background: '#e8f7ed'
          }}
        >
          <strong>
            ✅ Rectangle detected
          </strong>

          <p>
            The detector thinks this is a
            reliable rectangular product.
          </p>
        </div>
      )}

      {accepted === false && (
        <div
          style={{
            marginTop: '15px',
            padding: '15px',
            borderRadius: '10px',
            background: '#fff3e0'
          }}
        >
          <strong>
            🟡 No reliable rectangle detected
          </strong>

          {hint && <p>{hint}</p>}

          <p>
            CraftNest would preserve the
            original image.
          </p>
        </div>
      )}

      {corners && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '10px'
          }}
        >
          <h2>Detected Corners</h2>

          <pre>
            {JSON.stringify(
              corners,
              null,
              2
            )}
          </pre>
        </div>
      )}

      {image && (
        <div style={{ marginTop: '30px' }}>
          <h2>Original Image</h2>

          <img
            src={image}
            alt="Uploaded painting"
            style={{
              maxWidth: '700px',
              maxHeight: '600px',
              display: 'block',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </div>
  );
}