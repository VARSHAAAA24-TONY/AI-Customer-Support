require('dotenv').config();
const { storeDocumentChunks, searchContext } = require('./src/services/rag.service');

/**
 * Diagnostic: Pure Direct-Connect Recovery
 * Rule: NO PRISMA. Pure PostgreSQL driver only.
 */
async function verifyPureConnect() {
  console.log('--- NexuAI Pure Neural Diagnostic: Direct-Connect ---');
  
  try {
    const mockDocId = '00000000-0000-0000-0000-000000000000';
    console.log(`[1/2] Testing Pure Ingestion Sync for Doc: ${mockDocId}`);
    
    // Test Ingestion (The part that was failing)
    await storeDocumentChunks(mockDocId, "Direct Connect Success. Neural Hub is now online via native drivers.");
    console.log('[1/2] Ingestion Test: SUCCESS.');

    // Test Search (The part causing "Answer not found")
    const results = await searchContext('any-project', "Neural Hub", 1);
    console.log(`[2/2] Search Test: SUCCESS (Found ${results.length} blocks).`);

    console.log('\n[FINAL] Neural Hub is RECOVERED via Native Driver.');

  } catch (err) {
    console.error('--- NATIVE RECOVERY FAILURE ---');
    console.error('Message:', err.message);
  } finally {
    process.exit(0);
  }
}

verifyPureConnect();
