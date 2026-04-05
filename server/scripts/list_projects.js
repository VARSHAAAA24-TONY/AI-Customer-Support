const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
  console.log('--- DATABASE PROJECT LIST ---');
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: { select: { documents: true } }
      }
    });
    console.log(`Found ${projects.length} projects.`);
    projects.forEach(p => {
      console.log(`- ID: ${p.id} | Name: ${p.name} | Docs: ${p._count.documents}`);
    });
  } catch (err) {
    console.error('Database query failed:', err.message);
  } finally {
    await prisma.$disconnect();
    console.log('--- END ---');
  }
}

list();
