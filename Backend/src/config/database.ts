import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate database URL
if (!process.env.SUPABASE_DB_URL) {
  console.error('❌ SUPABASE_DB_URL is not defined in environment variables');
  process.exit(1);
}

// Clean the connection string (remove trailing spaces)
const connectionString = process.env.SUPABASE_DB_URL.trim();

console.log('📊 Attempting to connect to database...');
console.log('🔗 Host:', connectionString.split('@')[1]?.split(':')[0] || 'unknown');

// Database connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increased to 10 seconds for remote DB
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connection established successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err.message);
  // Don't exit immediately, let the pool try to reconnect
});

// Test initial connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db, version() as version');
    console.log('✅ Database connected successfully');
    console.log('📅 Server time:', result.rows[0].now);
    console.log('🗄️  Database:', result.rows[0].db);
    console.log('📦 PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    client.release();
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Tip: Check if database server is running and accessible');
      console.error('   💡 Tip: Verify SUPABASE_DB_URL in .env file');
    } else if (error.code === '28P01') {
      console.error('   💡 Tip: Check database password in SUPABASE_DB_URL');
    } else if (error.code === '3D000') {
      console.error('   💡 Tip: Database does not exist');
    }
    return false;
  }
};

export default pool;

