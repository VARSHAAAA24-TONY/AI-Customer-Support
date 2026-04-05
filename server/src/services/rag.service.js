const { Pool } = require('pg');
const { getEmbedding } = require('./embeddings.service');
const crypto = require('crypto');

// Optimized Connection Pool for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
  max: 20, 
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500, // Recycle to prevent leaks
});

const CHUNK_SIZE = 1000;
const OVERLAP = 100;

const chunkText = (text) => {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + CHUNK_SIZE));
    index += CHUNK_SIZE - OVERLAP;
  }
  return chunks;
};

/**
 * Stable Vector Ingestion (Neural Direct-Connect)
 */
const storeDocumentChunks = async (documentId, text) => {
  const client = await pool.connect();
  try {
    console.log(`[RAG-Direct] Ensuring extensions...`);
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    console.log(`[RAG-Direct] Splitting text into chunks...`);
    const chunks = chunkText(text.replace(/\0/g, ''));
    console.log(`[RAG-Direct] Generated ${chunks.length} chunks. Indexing...`);

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      const embedding = await getEmbedding(content);
      const vectorString = `[${embedding.join(',')}]`;
      const chunkId = crypto.randomUUID();

      await client.query(
        `INSERT INTO "Chunk" (id, content, embedding, "documentId") 
         VALUES ($1, $2, $3::vector, $4)`,
        [chunkId, content, vectorString, documentId]
      );
    }
  } catch (err) {
    console.error(`[RAG-Direct Critical] Ingestion Failed:`, err.message);
    throw new Error(`Neural Hub Sync Failure: ${err.message}`);
  } finally {
    client.release();
  }
};

/**
 * Stable Semantic Search (Neural Direct-Connect)
 */
const searchContext = async (projectId, queryText, limit = 5) => {
  const client = await pool.connect();
  try {
    const queryEmbedding = await getEmbedding(queryText);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const res = await client.query(
      `SELECT c.content, d.name as "documentName"
       FROM "Chunk" c
       JOIN "Document" d ON c."documentId" = d.id
       WHERE d."projectId" = $1
       ORDER BY c.embedding <=> $2::vector
       LIMIT $3`,
      [projectId, vectorString, limit]
    );
    return res.rows;
  } catch (err) {
    console.error(`[RAG-Direct Critical] Search Failed:`, err.message);
    return [];
  } finally {
    client.release();
  }
};

module.exports = {
  storeDocumentChunks,
  searchContext,
};
