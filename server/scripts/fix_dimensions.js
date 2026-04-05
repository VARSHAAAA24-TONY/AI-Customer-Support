const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDimensions() {
  console.log('--- DATABASE DIMENSION FIX START ---');
  try {
    // 1. Truncate to avoid data conversion errors
    console.log('[1/3] Truncating Chunk table...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Chunk" CASCADE');

    // 2. Alter column type to 384 dimensions
    console.log('[2/3] Altering embedding column to vector(384)...');
    // Note: We use executeRawUnsafe because Prisma doesn't natively support vector(384) in schema.prisma yet
    await prisma.$executeRawUnsafe('ALTER TABLE "Chunk" ALTER COLUMN embedding TYPE vector(384)');

    // 3. Optional: Recreate HNSW index if needed (postgres will handle basic searches fine without it for now)
    console.log('[3/3] Dimension fix complete.');
    
    console.log('Database successfully migrated to Transformers.js compatibility (384 dims).');
  } catch (err) {
    console.error('Migration failed:', err.message);
    console.log('Attempting fallback: Recreating the table...');
    try {
        await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "Chunk" CASCADE');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "Chunk" (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                embedding vector(384),
                "documentId" TEXT NOT NULL,
                FOREIGN KEY ("documentId") REFERENCES "Document"(id) ON DELETE CASCADE
            )
        `);
        console.log('Fallback Success: Chunk table recreated with vector(384).');
    } catch (fallbackErr) {
        console.error('Fallback failed:', fallbackErr.message);
    }
  } finally {
    await prisma.$disconnect();
    console.log('--- DATABASE DIMENSION FIX END ---');
  }
}

fixDimensions();
