import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate Supabase credentials
if (!process.env.SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is not defined in environment variables');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
  process.exit(1);
}

console.log('📊 Initializing Supabase client...');
console.log('🔗 URL:', process.env.SUPABASE_URL);

// Create Supabase client with SERVICE_ROLE_KEY to bypass RLS
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-client-info': 'sentiscope-backend',
      },
    },
    db: {
      schema: 'public',
    },
    // Increase timeout to 30 seconds
    realtime: {
      timeout: 30000,
    },
  }
);

// Test connection
export const testConnection = async () => {
  try {
    // Test query to check connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
      return false;
    }

    console.log('✅ Database connected successfully via Supabase');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    return false;
  }
};

export default supabase;
