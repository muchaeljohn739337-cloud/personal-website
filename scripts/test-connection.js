const { Pool } = require('pg');

const connectionString =
  'postgresql://postgres.xesecqcqzykvmrtxrzqi:1j4wUXLfkSxe2Zds@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, // Only for testing, remove in production
  },
});

async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT 1 as test');
    console.log('✅ Database connection successful!', res.rows[0]);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection();
