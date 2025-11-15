import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';

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
      fetch: async (url, options = {}) => {
        try {
          // Sanitize request headers - remove invalid characters
          const sanitizedHeaders: Record<string, string> = {};
          if (options.headers) {
            // Handle Headers object
            if (options.headers instanceof Headers) {
              options.headers.forEach((value, key) => {
                if (typeof value === 'string') {
                  sanitizedHeaders[key] = value;
                }
              });
            }
            // Handle plain object
            else if (typeof options.headers === 'object') {
              Object.entries(options.headers).forEach(([key, value]) => {
                // Only include string values, convert others to strings
                if (typeof value === 'string') {
                  sanitizedHeaders[key] = value;
                } else if (value !== null && value !== undefined) {
                  // Convert to string if it's not null/undefined
                  sanitizedHeaders[key] = String(value);
                }
              });
            }
          }

          // Use axios instead of native fetch for better stability
          const response = await axios({
            url: url.toString(),
            method: (options.method as string) || 'GET',
            headers: sanitizedHeaders,
            data: options.body,
            timeout: 60000, // 60 second timeout
            validateStatus: () => true, // Don't throw on any status
          });

          // Convert axios response to fetch Response format
          // Safely convert headers, filtering out invalid ones
          const headers = new Headers();
          if (response.headers && typeof response.headers === 'object') {
            Object.entries(response.headers).forEach(([key, value]) => {
              // Only add valid header values (strings or string arrays)
              if (typeof value === 'string') {
                headers.set(key, value);
              } else if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
                headers.set(key, value.join(', '));
              }
            });
          }

          return new Response(JSON.stringify(response.data), {
            status: response.status,
            statusText: response.statusText,
            headers: headers,
          });
        } catch (error: any) {
          console.error('❌ Custom fetch error:', error.message);
          throw error;
        }
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
