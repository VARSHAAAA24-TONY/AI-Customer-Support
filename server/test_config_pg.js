const { Client } = require('pg');

async function testWithConfig() {
  const client = new Client({
    user: 'neondb_owner',
	host: 'ep-young-boat-amu52c39-pooler.us-east-1.aws.neon.tech',
	database: 'neondb',
	password: 'Varsha#N2026',
	port: 5432,
	ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("Attempting PG connection with config object...");
    await client.connect();
    console.log("SUCCESS: Connected to PG using config object!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
  } catch (err) {
    console.error("FAILED to connect with config:", err.message);
  } finally {
    await client.end();
  }
}

testWithConfig();
