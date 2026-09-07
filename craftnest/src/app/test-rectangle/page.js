"use client";

import { useRef, useState } from "react";

function findPaintingRectangle(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  const maxSize = 1200;

  const scale = Math.min(
    1,
    maxSize / Math.max(image.naturalWidth, image.naturalHeight)
  );

  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);

  ctx.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const { width, height } = canvas;

  const data = ctx.getImageData(
    0,
    0,
    width,
    height
  ).data;

  const gray = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      gray[y * width + x] =
        0.299 * data[i] +
        0.587 * data[i + 1] +
        0.114 * data[i + 2];
    }
  }

  const rowStrength = new Float32Array(height);
  const colStrength = new Float32Array(width);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const current = gray[y * width + x];

      const horizontal =
        Math.abs(
          current -
            gray[y * width + (x - 1)]
        ) +
        Math.abs(
          current -
            gray[y * width + (x + 1)]
        );

      const vertical =
        Math.abs(
          current -
            gray[(y - 1) * width + x]
        ) +
        Math.abs(
          current -
            gray[(y + 1) * width + x]
        );

      colStrength[x] += horizontal;
      rowStrength[y] += vertical;
    }
  }

  function smooth(array, radius) {
    const result = new Float32Array(
      array.length
    );

    for (let i = 0; i < array.length; i++) {
      let total = 0;
      let count = 0;

      for (
        let j = Math.max(0, i - radius);
        j <=
        Math.min(
          array.length - 1,
          i + radius
        );
        j++
      ) {
        total += array[j];
        count++;
      }

      result[i] = total / count;
    }

    return result;
  }

  const rows = smooth(rowStrength, 8);
  const cols = smooth(colStrength, 8);

  const minX = Math.floor(width * 0.08);
  const maxX = Math.floor(width * 0.92);

  const minY = Math.floor(height * 0.08);
  const maxY = Math.floor(height * 0.92);

  function findPeaks(array, min, max) {
    const candidates = [];

    for (
      let i = min + 5;
      i < max - 5;
      i++
    ) {
      let localMaximum = true;

      for (
        let j = i - 5;
        j <= i + 5;
        j++
      ) {
        if (array[j] > array[i]) {
          localMaximum = false;
          break;
        }
      }

      if (localMaximum) {
        candidates.push({
          position: i,
          strength: array[i],
        });
      }
    }

    candidates.sort(
      (a, b) =>
        b.strength - a.strength
    );

    return candidates.slice(0, 15);
  }

  const verticalCandidates =
    findPeaks(cols, minX, maxX);

  const horizontalCandidates =
    findPeaks(rows, minY, maxY);

  let best = null;

  for (const left of verticalCandidates) {
    for (const right of verticalCandidates) {
      if (
        right.position <=
        left.position
      ) {
        continue;
      }

      const candidateWidth =
        right.position -
        left.position;

      if (
        candidateWidth <
        width * 0.25
      ) {
        continue;
      }

      if (
        candidateWidth >
        width * 0.90
      ) {
        continue;
      }

      for (const top of horizontalCandidates) {
        for (const bottom of horizontalCandidates) {
          if (
            bottom.position <=
            top.position
          ) {
            continue;
          }

          const candidateHeight =
            bottom.position -
            top.position;

          if (
            candidateHeight <
            height * 0.25
          ) {
            continue;
          }

          if (
            candidateHeight >
            height * 0.90
          ) {
            continue;
          }

          const area =
            candidateWidth *
            candidateHeight;

          const areaRatio =
            area /
            (width * height);

          if (areaRatio < 0.20) {
            continue;
          }

          const boundaryScore =
            left.strength +
            right.strength +
            top.strength +
            bottom.strength;

          const sizeScore =
            areaRatio * 100;

          const score =
            boundaryScore +
            sizeScore * 1000;

          if (
            !best ||
            score > best.score
          ) {
            best = {
              left: left.position,
              right: right.position,
              top: top.position,
              bottom: bottom.position,
              score,
            };
          }
        }
      }
    }
  }

  if (!best) {
    return null;
  }

  return {
    left: best.left / scale,
    right: best.right / scale,
    top: best.top / scale,
    bottom: best.bottom / scale,
  };
}


function cropImage(image, rectangle) {
  const width =
    rectangle.right -
    rectangle.left;

  const height =
    rectangle.bottom -
    rectangle.top;

  const border = 55;

  const canvas =
    document.createElement("canvas");

  canvas.width =
    width + border * 2;

  canvas.height =
    height + border * 2;

  const ctx =
    canvas.getContext("2d");

  /*
   * Thick brown outer border
   */
  ctx.fillStyle = "#5b3825";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  /*
   * Clean white inner border
   */
  ctx.fillStyle = "#ffffff";

  ctx.fillRect(
    15,
    15,
    canvas.width - 30,
    canvas.height - 30
  );

  /*
   * Mild image enhancement.
   *
   * This is intentionally subtle:
   * brightness +8%
   * contrast +6%
   * saturation +4%
   */
  ctx.filter =
    "brightness(1.08) contrast(1.06) saturate(1.04)";

  ctx.drawImage(
    image,
    rectangle.left,
    rectangle.top,
    width,
    height,
    border,
    border,
    width,
    height
  );

  /*
   * Reset filter after drawing.
   */
  ctx.filter = "none";

  return canvas.toDataURL(
    "image/jpeg",
    0.92
  );
}


export default function RectangleDetectionTest() {
  const [image, setImage] =
    useState(null);

  const [result, setResult] =
    useState(null);

  const [status, setStatus] =
    useState("Ready");

  const [error, setError] =
    useState("");

  const imageRef =
    useRef(null);


  function handleUpload(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setResult(null);
    setError("");
    setStatus(
      "Loading image..."
    );

    const reader =
      new FileReader();

    reader.onload = () => {
      const img =
        new Image();

      img.onload = () => {
        imageRef.current = img;

        setImage(
          reader.result
        );

        setStatus(
          "Image ready — click Detect & Crop"
        );
      };

      img.onerror = () => {
        setError(
          "Could not load this image."
        );

        setStatus("Failed");
      };

      img.src =
        reader.result;
    };

    reader.readAsDataURL(file);
  }


  function processImage() {
    if (!imageRef.current) {
      return;
    }

    setError("");
    setResult(null);

    setStatus(
      "Detecting painting rectangle..."
    );

    setTimeout(() => {
      try {
        const rectangle =
          findPaintingRectangle(
            imageRef.current
          );

        if (!rectangle) {
          throw new Error(
            "No clear rectangular painting boundary was detected."
          );
        }

        console.log(
          "Detected rectangle:",
          rectangle
        );

        setStatus(
          "Cropping and enhancing painting..."
        );

        const cropped =
          cropImage(
            imageRef.current,
            rectangle
          );

        setResult(cropped);

        setStatus(
          "✓ Painting detected, cropped and enhanced"
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Image processing failed."
        );

        setStatus(
          "Processing failed"
        );
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
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >

        <h1>
          Painting Rectangle Detection
        </h1>

        <p>
          Upload a painting photograph.
          The system detects the painting
          boundary, crops it, and applies
          mild image enhancement.
        </p>


        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "25px",
          }}
        >

          <input
            type="file"
            accept="image/*"
            onChange={
              handleUpload
            }
          />

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

            <h2>
              Original Image
            </h2>

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
              onClick={
                processImage
              }
              style={{
                marginTop: "20px",
                padding:
                  "14px 24px",
                background:
                  "#5b3825",
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

            <h2>
              Processed Painting
            </h2>

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