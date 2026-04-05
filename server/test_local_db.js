const { Client } = require('pg');

async function checkLocal() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/ai_support_agent'
  });
  
  try {
    console.log("Checking localhost:5432 for Postgres...");
    await client.connect();
    console.log("SUCCESS: Local Postgres found!");
  } catch (err) {
    console.log("FAILED: No local Postgres on 5432:", err.message);
  } finally {
    await client.end();
  }
}

checkLocal();
