import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Use Vite specific env vars for client-side accessibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Warnings if Supabase credentials are not configured or are using default placeholders
if (!supabaseUrl || supabaseUrl === "YOUR_SUPABASE_URL") {
  console.warn("Supabase URL is not defined or uses the default placeholder. Please set the VITE_SUPABASE_URL environment variable in your .env file.");
}

if (!supabaseAnonKey || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
  console.warn("Supabase anon key is not defined or uses the default placeholder. Please set the VITE_SUPABASE_ANON_KEY environment variable in your .env file.");
}

/**
 * Creates a Supabase client for the public schema (journal entries, etc.)
 */
export function createPublicSchemaClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "YOUR_SUPABASE_URL" || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
    throw new Error('Supabase URL or Anon Key is not properly configured. Please check your environment variables and ensure they are not using default placeholder values.');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public'  // Use the public schema for journal entries and main app data
    },
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken();

        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
}

/**
 * Creates a Supabase client for the bean_ai_realtime schema (support functionality)
 */
export function createSupportSchemaClient(
  getToken: () => Promise<string | null>
): SupabaseClient<Database, 'bean_ai_realtime', Database['bean_ai_realtime']> {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "YOUR_SUPABASE_URL" || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
    throw new Error('Supabase URL or Anon Key is not properly configured. Please check your environment variables and ensure they are not using default placeholder values.');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'bean_ai_realtime'  // Use the bean_ai_realtime schema for support features
    },
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken();

        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
}

/**
 * Legacy function for backward compatibility - now uses public schema
 */
export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  return createPublicSchemaClient(getToken);
}