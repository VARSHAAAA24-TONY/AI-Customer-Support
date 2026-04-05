const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testInsert() {
  try {
    // 1. Get first project
    const project = await prisma.project.findFirst();
    if (!project) return console.log("No project found to test.");

    console.log("Found Project:", project.id);

    // 2. Try create document
    const doc = await prisma.document.create({
      data: {
        name: "test_doc.txt",
        type: "text/plain",
        projectId: project.id
      }
    });
    console.log("SUCCESS creating document:", doc.id);

    // 3. Try create chunk (RAG check)
    // Note: This might fail if the raw query has syntax errors
    const content = "Test content";
    const vectorString = `[${new Array(1536).fill(0).join(',')}]`;
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Chunk" (id, content, embedding, "documentId") 
       VALUES (gen_random_uuid(), $1, $2::vector, $3)`,
      content,
      vectorString,
      doc.id
    );
    console.log("SUCCESS creating chunk (vector)");

  } catch (err) {
    console.error("TEST FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testInsert();
