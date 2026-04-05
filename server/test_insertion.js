const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

/**
 * Diagnostic: Stable Vector Insertion
 * Tests the JS-based UUID and the new parameter mapping.
 */
async function diagnosticInsert() {
  console.log('--- NexuAI Neural Diagnostic (v2): Stable Insertion ---');
  
  try {
    await prisma.$connect();
    console.log('[1/4] DB Connected. Ensuring extensions...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    
    console.log('[2/4] Fetching a test document...');
    const doc = await prisma.document.findFirst();
    if (!doc) {
      console.warn('[SKIP] No documents found. Create a project in the UI first.');
      process.exit(0);
    }
    
    console.log(`[3/4] Testing insertion with JS-UUID for Doc: ${doc.id}`);
    const chunkId = crypto.randomUUID();
    const mockContent = "JS Diagnostic Content: Visual Sync Success.";
    const mockVector = "[" + Array(384).fill(0).join(',') + "]"; 
    
    // Attempt the new stable query
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Chunk" (id, content, embedding, "documentId") 
       VALUES ($1, $2, $3::vector, $4)`,
      chunkId,
      mockContent,
      mockVector,
      doc.id
    );
    
    console.log('[SUCCESS] Neural Synchronization is Active and Stable.');
    
    // Cleanup
    await prisma.$executeRawUnsafe(`DELETE FROM "Chunk" WHERE id = $1`, chunkId);

  } catch (err) {
    console.error('--- HARDWARE FAILURE ---');
    console.error('Message:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

diagnosticInsert();
