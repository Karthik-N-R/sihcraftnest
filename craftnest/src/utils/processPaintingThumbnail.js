/**
 * Reusable Painting Thumbnail Processor
 * Detects painting rectangle using browser Canvas gradient edge scoring,
 * crops it with custom border framing, and applies subtle image enhancement.
 */

export function findPaintingRectangle(image) {
  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return null;
  }

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

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  const gray = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      gray[y * width + x] =
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
  }

  const rowStrength = new Float32Array(height);
  const colStrength = new Float32Array(width);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const current = gray[y * width + x];
      const horizontal =
        Math.abs(current - gray[y * width + (x - 1)]) +
        Math.abs(current - gray[y * width + (x + 1)]);
      const vertical =
        Math.abs(current - gray[(y - 1) * width + x]) +
        Math.abs(current - gray[(y + 1) * width + x]);

      colStrength[x] += horizontal;
      rowStrength[y] += vertical;
    }
  }

  function smooth(array, radius) {
    const result = new Float32Array(array.length);
    for (let i = 0; i < array.length; i++) {
      let total = 0;
      let count = 0;
      for (
        let j = Math.max(0, i - radius);
        j <= Math.min(array.length - 1, i + radius);
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
    for (let i = min + 5; i < max - 5; i++) {
      let localMaximum = true;
      for (let j = i - 5; j <= i + 5; j++) {
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
    candidates.sort((a, b) => b.strength - a.strength);
    return candidates.slice(0, 15);
  }

  const verticalCandidates = findPeaks(cols, minX, maxX);
  const horizontalCandidates = findPeaks(rows, minY, maxY);

  let best = null;

  for (const left of verticalCandidates) {
    for (const right of verticalCandidates) {
      if (right.position <= left.position) continue;
      const candidateWidth = right.position - left.position;
      if (candidateWidth < width * 0.25 || candidateWidth > width * 0.9) continue;

      for (const top of horizontalCandidates) {
        for (const bottom of horizontalCandidates) {
          if (bottom.position <= top.position) continue;
          const candidateHeight = bottom.position - top.position;
          if (candidateHeight < height * 0.25 || candidateHeight > height * 0.9) continue;

          const area = candidateWidth * candidateHeight;
          const areaRatio = area / (width * height);
          if (areaRatio < 0.2) continue;

          const boundaryScore =
            left.strength + right.strength + top.strength + bottom.strength;
          const sizeScore = areaRatio * 100;
          const score = boundaryScore + sizeScore * 1000;

          if (!best || score > best.score) {
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

  if (!best) return null;

  return {
    left: best.left / scale,
    right: best.right / scale,
    top: best.top / scale,
    bottom: best.bottom / scale,
  };
}

export function cropImage(image, rectangle) {
  const width = rectangle.right - rectangle.left;
  const height = rectangle.bottom - rectangle.top;
  const border = 55;

  const canvas = document.createElement("canvas");
  canvas.width = width + border * 2;
  canvas.height = height + border * 2;

  const ctx = canvas.getContext("2d");

  // Thick brown outer border
  ctx.fillStyle = "#5b3825";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Clean white inner border
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(15, 15, canvas.width - 30, canvas.height - 30);

  // Subtle image enhancement: brightness +8%, contrast +6%, saturation +4%
  ctx.filter = "brightness(1.08) contrast(1.06) saturate(1.04)";

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

  ctx.filter = "none";

  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Main export for processing a painting image data URL or image source into a framed thumbnail.
 * Returns a Promise that resolves to the processed data URL string or null if failed.
 */
export async function processPaintingThumbnail(imageDataUrl) {
  if (typeof window === "undefined" || !imageDataUrl) {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const rectangle = findPaintingRectangle(img);
        if (!rectangle) {
          console.warn("Painting thumbnail processor: No clear rectangle boundary detected.");
          return resolve(null);
        }
        const cropped = cropImage(img, rectangle);
        resolve(cropped);
      } catch (err) {
        console.warn("Painting thumbnail processor exception:", err);
        resolve(null);
      }
    };
    img.onerror = (err) => {
      console.warn("Painting thumbnail processor failed to load image:", err);
      resolve(null);
    };
    img.src = imageDataUrl;
  });
}
