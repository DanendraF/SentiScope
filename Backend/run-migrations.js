const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL?.trim(),
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigrations() {
  console.log('='.repeat(60));
  console.log('🗄️  SentiScope Database Migration Runner');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test connection
    console.log('📊 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Connected to:', result.rows[0].version.split(',')[0]);
    console.log('');

    // Get migration files
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${files.length} migration files`);
    console.log('');

    // Run each migration
    for (const file of files) {
      console.log(`⏳ Running: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);
        console.log(`✅ Success: ${file}`);
      } catch (error) {
        console.error(`❌ Error in ${file}:`, error.message);
        // Continue with next migration
      }
    }

    console.log('');
    console.log('📋 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`✅ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    client.release();
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ Migration failed!');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('');

    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Tips:');
      console.error('   1. Check if SUPABASE_DB_URL is correct in .env');
      console.error('   2. Verify internet connection');
      console.error('   3. Check if Supabase project is active');
      console.error('   4. Try connecting via psql directly');
    }

    process.exit(1);
  }
}

runMigrations();
