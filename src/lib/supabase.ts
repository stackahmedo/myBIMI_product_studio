import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL) as string | undefined;
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY
) as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (
    supabaseUrl.includes('your-project.supabase.co') ||
    supabaseUrl.includes('placeholder') ||
    supabaseAnonKey.includes('your-anon-key') ||
    supabaseAnonKey.length < 20
  ) {
    return false;
  }
  try {
    new URL(supabaseUrl);
    return true;
  } catch {
    return false;
  }
};

export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl || '',
    anonKey: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 8)}...` : '',
    isConfigured: isSupabaseConfigured(),
  };
};

/**
 * Singleton Supabase Client with persistent authentication
 */
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient(
      'https://placeholder-project.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.secret',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
