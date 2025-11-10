const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL?.trim(),
  ssl: { rejectUnauthorized: false },
});

async function verifySchema() {
  try {
    const client = await pool.connect();

    console.log('📊 Checking users table schema...\n');

    const result = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('Users Table Columns:');
    console.log('='.repeat(80));
    result.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '✅ NULL' : '❌ NOT NULL';
      console.log(`${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | ${nullable}`);
    });
    console.log('='.repeat(80));

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifySchema();
