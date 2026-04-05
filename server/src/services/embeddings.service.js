const { pipeline } = require('@xenova/transformers');

let extractor = null;

/**
 * Generates a local embedding for the given text using Transformers.js.
 * Model: Xenova/all-MiniLM-L6-v2 (384 dimensions)
 * This model is fast, efficient, and runs entirely on the CPU/local environment.
 */
const getEmbedding = async (text) => {
  try {
    if (!extractor) {
      console.log('[Embeddings] Initializing local model (Xenova/all-MiniLM-L6-v2)...');
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    // Generate features
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    
    // Convert Float32Array to standard Number array
    return Array.from(output.data);
  } catch (err) {
    console.error('[Embeddings Error] Failed to generate local embedding:', err.message);
    throw err;
  }
};

module.exports = { getEmbedding };
