/**
 * Defines the contract that all classifiers must implement.
 * This allows swapping out the mock classifier with a real ML model later.
 */

/**
 * @typedef {Object} ClassificationResult
 * @property {string}   label      - Detected craft category (e.g. "Pottery")
 * @property {number}   confidence - 0-1 confidence score
 * @property {string[]} tags       - Additional descriptive tags
 */

/**
 * Classifies an image file to detect the craft type.
 * @param {File} imageFile - The uploaded image file
 * @returns {Promise<ClassificationResult>}
 */
export async function classifyImage(imageFile) {
  throw new Error('Not implemented. Use a concrete classifier implementation.');
}
