/**
 * Mock implementation of the classifier interface for demo purposes.
 */

const CATEGORIES = [
  "Pottery & Ceramics", 
  "Woven Textiles", 
  "Handmade Jewelry", 
  "Woodcraft", 
  "Block Print Art", 
  "Leather Goods", 
  "Metal Work", 
  "Embroidery"
];

const MOCK_TAGS = {
  "Pottery & Ceramics": ["clay", "handmade", "vase", "bowl", "terracotta"],
  "Woven Textiles": ["fabric", "loom", "cotton", "silk", "pattern"],
  "Handmade Jewelry": ["silver", "gold", "gemstone", "necklace", "earrings"],
  "Woodcraft": ["carved", "teak", "sculpture", "furniture", "polished"],
  "Block Print Art": ["indigo", "floral", "stamp", "dye", "cotton"],
  "Leather Goods": ["bag", "wallet", "tooled", "vintage", "stitching"],
  "Metal Work": ["brass", "copper", "engraved", "lamp", "utensil"],
  "Embroidery": ["thread", "needlework", "colorful", "mirror-work", "kutch"]
};

/**
 * Simulates classifying an image by returning a random or pseudo-random result.
 * @param {File} imageFile 
 * @returns {Promise<import('./classifierInterface.js').ClassificationResult>}
 */
export async function classifyImage(imageFile) {
  // Simulate network/inference delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // For the demo, let's try to guess from the filename if possible, otherwise pick random
  const filename = imageFile.name.toLowerCase();
  
  let detectedCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  
  if (filename.includes('pottery') || filename.includes('vase')) detectedCategory = "Pottery & Ceramics";
  else if (filename.includes('textile') || filename.includes('fabric')) detectedCategory = "Woven Textiles";
  else if (filename.includes('jewelry') || filename.includes('necklace')) detectedCategory = "Handmade Jewelry";
  else if (filename.includes('wood')) detectedCategory = "Woodcraft";
  else if (filename.includes('print')) detectedCategory = "Block Print Art";
  
  const confidence = 0.75 + (Math.random() * 0.2); // Random between 0.75 and 0.95
  
  // Pick 3 random tags for the category
  const categoryTags = MOCK_TAGS[detectedCategory] || [];
  const shuffledTags = [...categoryTags].sort(() => 0.5 - Math.random());
  const tags = shuffledTags.slice(0, 3);

  return {
    label: detectedCategory,
    confidence: Number(confidence.toFixed(2)),
    tags
  };
}
