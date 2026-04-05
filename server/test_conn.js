const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Attempting database connection...");
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("Connection SUCCESS:", res);
  } catch (err) {
    console.error("Connection FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
