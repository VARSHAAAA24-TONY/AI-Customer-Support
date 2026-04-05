const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('--- DB CLEANUP START ---');
  try {
    const { count } = await prisma.chunk.deleteMany({});
    console.log(`Successfully deleted ${count} incompatible vector chunks.`);
    console.log('Database is now ready for local 384-dimensional embeddings.');
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  } finally {
    await prisma.$disconnect();
    console.log('--- DB CLEANUP END ---');
  }
}

cleanup();
