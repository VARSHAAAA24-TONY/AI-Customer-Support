const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Diagnostic: Data Integrity & RAG Consistency
 * Verifies if project documents exist and if their embeddings match the current logic.
 */
async function verifyRAG() {
  console.log('--- NexuAI RAG Diagnostic: Data Consistency Check ---');
  
  try {
    await prisma.$connect();
    
    // 1. Check total chunks
    const chunkCount = await prisma.chunk.count();
    console.log(`[1/4] Total Knowledge Chunks in DB: ${chunkCount}`);

    if (chunkCount === 0) {
      console.warn('[FAILURE] The Knowledge Base is empty. Sync documents first.');
      process.exit(0);
    }

    // 2. Check Dimension Integrity
    const sample = await prisma.$queryRawUnsafe(`SELECT id, vector_dims(embedding) as dims, "documentId" FROM "Chunk" LIMIT 1;`);
    const dims = sample[0]?.dims || 0;
    console.log(`[2/4] Live Vector Dimensions: ${dims}`);
    
    if (dims !== 384) {
      console.error(`[CRITICAL] Dimension Mismatch! DB uses ${dims} but current logic expects 384.`);
      console.warn('HINT: You must purge the Knowledge Base and re-sync your documents.');
    } else {
      console.log('[SUCCESS] Vector Dimensions are consistent with MiniLM Model (384).');
    }

    // 3. Check Orphaned Documents
    const documents = await prisma.document.findMany({
      include: { _count: { select: { chunks: true } } }
    });
    console.log(`[3/4] Projects/Documents Status:`);
    documents.forEach(doc => {
      console.log(`    - [${doc._count.chunks > 0 ? 'SYNCED' : 'VOID'}] Doc: ${doc.name} (ID: ${doc.id})`);
    });

    // 4. Test Semantic Search for a simple query
    const { searchContext } = require('./src/services/rag.service');
    const firstProject = await prisma.project.findFirst();
    if (firstProject) {
      console.log(`[4/4] Testing Semantic Search for Project: ${firstProject.id}...`);
      const results = await searchContext(firstProject.id, "test query");
      console.log(`[SUCCESS] Search returned ${results.length} results.`);
    }

  } catch (err) {
    console.error('--- RAG DIAGNOSTIC FAILURE ---');
    console.error('Message:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

verifyRAG();
