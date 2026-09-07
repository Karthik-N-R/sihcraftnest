"use client";

import { useRef, useState } from "react";
import { findPaintingRectangle, cropImage } from "../../utils/processPaintingThumbnail";

export default function RectangleDetectionTest() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");

  const imageRef = useRef(null);

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setResult(null);
    setError("");
    setStatus("Loading image...");

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        imageRef.current = img;
        setImage(reader.result);
        setStatus("Image ready — click Detect & Crop");
      };

      img.onerror = () => {
        setError("Could not load this image.");
        setStatus("Failed");
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  }

  function processImage() {
    if (!imageRef.current) {
      return;
    }

    setError("");
    setResult(null);
    setStatus("Detecting painting rectangle...");

    setTimeout(() => {
      try {
        const rectangle = findPaintingRectangle(imageRef.current);

        if (!rectangle) {
          throw new Error("No clear rectangular painting boundary was detected.");
        }

        console.log("Detected rectangle:", rectangle);
        setStatus("Cropping and enhancing painting...");

        const cropped = cropImage(imageRef.current, rectangle);
        setResult(cropped);
        setStatus("✓ Painting detected, cropped and enhanced");
      } catch (err) {
        console.error(err);
        setError(err.message || "Image processing failed.");
        setStatus("Processing failed");
      }
    }, 50);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#f5f1ec",
        color: "#2c211b",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1>Painting Rectangle Detection</h1>
        <p>
          Upload a painting photograph. The system detects the painting boundary,
          crops it, and applies mild image enhancement.
        </p>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "25px",
          }}
        >
          <input type="file" accept="image/*" onChange={handleUpload} />

          <p
            style={{
              fontWeight: "bold",
              marginTop: "15px",
            }}
          >
            Status: {status}
          </p>

          {error && (
            <p
              style={{
                color: "crimson",
                fontWeight: "bold",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {image && (
          <section
            style={{
              marginTop: "30px",
            }}
          >
            <h2>Original Image</h2>

            <img
              src={image}
              alt="Uploaded painting"
              style={{
                maxWidth: "100%",
                maxHeight: "650px",
                display: "block",
              }}
            />

            <button
              onClick={processImage}
              style={{
                marginTop: "20px",
                padding: "14px 24px",
                background: "#5b3825",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Detect & Crop Painting
            </button>
          </section>
        )}

        {result && (
          <section
            style={{
              marginTop: "40px",
            }}
          >
            <h2>Processed Painting</h2>

            <img
              src={result}
              alt="Detected and cropped painting"
              style={{
                maxWidth: "100%",
                maxHeight: "700px",
                display: "block",
              }}
            />

            <p
              style={{
                marginTop: "15px",
                fontWeight: "bold",
              }}
            >
              ✓ Painting boundary detected
              <br />
              ✓ Cropped to painting
              <br />
              ✓ Brightness enhanced
              <br />
              ✓ Contrast enhanced
              <br />
              ✓ Processing border added
            </p>
          </section>
        )}
      </div>
    </main>
  );
}