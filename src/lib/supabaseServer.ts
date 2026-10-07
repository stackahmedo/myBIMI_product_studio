/**
 * Supabase Server Utilities
 * Powered by @supabase/server
 *
 * Provides server-side authentication, JWT verification, and context injection
 * for backend handlers, server routes, and edge functions.
 */

import { withSupabase } from '@supabase/server';

export { withSupabase };

export interface SupabaseServerConfig {
  supabaseUrl?: string;
  publishableKey?: string;
  secretKey?: string;
  jwksUrl?: string;
}

/**
 * Returns server-side Supabase configuration from environment
 */
export function getSupabaseServerConfig(): SupabaseServerConfig {
  return {
    supabaseUrl: process.env.SUPABASE_URL || 'https://ohuxevrhdpwcpaipxhqm.supabase.co',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5SndaauFfQC8W2Al33WgyQ_bdKLEXK0',
    secretKey: process.env.SUPABASE_SECRET_KEY,
    jwksUrl: process.env.SUPABASE_JWKS_URL || 'https://ohuxevrhdpwcpaipxhqm.supabase.co/auth/v1/.well-known/jwks.json',
  };
}
