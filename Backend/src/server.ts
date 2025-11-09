import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

// Test Supabase Connection
async function testSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');

    // Test 1: Supabase Client Connection
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Test connection dengan query sederhana
      const { error } = await supabase.from('users').select('count').limit(1);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = table not found (OK jika tabel belum dibuat)
        console.log('⚠️  Supabase Client:', error.message);
      } else {
        console.log('✅ Supabase Client: Connected successfully');
      }
    } else {
      console.log('⚠️  Supabase Client: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    // Test 2: Database Connection (PostgreSQL)
    if (process.env.SUPABASE_DB_URL) {
      const pool = new Pool({
        connectionString: process.env.SUPABASE_DB_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      });

      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();
      await pool.end();

      console.log('✅ Database Connection: Connected successfully');
      console.log(`   Database Time: ${result.rows[0].current_time}`);
      console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    } else {
      console.log('⚠️  Database Connection: Missing SUPABASE_DB_URL');
    }

    console.log('✅ Supabase connection test completed\n');
  } catch (error: any) {
    console.error('❌ Supabase connection test failed:');
    console.error(`   Error: ${error.message}`);
    console.error('   Please check your SUPABASE_DB_URL and credentials\n');
  }
}

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log('');

  // Test Supabase connection on startup
  await testSupabaseConnection();
});

export default app;

