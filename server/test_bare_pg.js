const { Client } = require('pg');
require('dotenv').config();

async function testBarePG() {
  console.log("Attempting direct PG connection to:", process.env.DATABASE_URL);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected to PG directly!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
  } catch (err) {
    console.error("FAILED to connect directly:", err.message);
  } finally {
    await client.end();
  }
}

testBarePG();
