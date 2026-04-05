require('dotenv').config();
const { Pool } = require('pg');

/**
 * Diagnostic & Rescue: Grounding Re-sync
 * This script identifies and purges "Ghost" documents that have metadata but 0 chunks.
 * These caused the "Workspace Grounding Empty" errors for the user.
 */
async function cleanupGrounding() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('--- NexuAI Neural Diagnostic: Grounding Sync ---');
  
  try {
    const client = await pool.connect();
    
    // 1. Find all documents that have 0 chunks
    console.log('[1/2] Identifying Orphaned (Ghost) Documents...');
    const scan = await client.query(`
      SELECT id, name, "projectId" 
      FROM "Document" 
      WHERE id NOT IN (SELECT DISTINCT "documentId" FROM "Chunk")
    `);
    
    if (scan.rows.length === 0) {
      console.log('[SUCCESS] All currently synced documents are correctly grounded.');
    } else {
      console.warn(`[DIAGNOSTIC] Found ${scan.rows.length} orphaned documents.`);
      scan.rows.forEach(r => console.log(`    - Found Ghost: ${r.name} (Project: ${r.projectId})`));

      // 2. Cleanup orphaned records
      console.log('[2/2] Pursing Neural Cleanup...');
      const del = await client.query(`
        DELETE FROM "Document" 
        WHERE id NOT IN (SELECT DISTINCT "documentId" FROM "Chunk")
      `);
      console.log(`[RECOVERY SUCCESS] Purged ${del.rowCount} ghost records from the Hub.`);
    }

  } catch (err) {
    console.error('--- GROUNDING RECOVERY FAILURE ---');
    console.error('Message:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

cleanupGrounding();
