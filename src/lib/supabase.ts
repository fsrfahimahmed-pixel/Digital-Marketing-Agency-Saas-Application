import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration from environment variables
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://csedlsciyxpdusqblbgv.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_KTG4rJ-kmd7TI_88XJeP_A_yzDycRss';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('YOUR_SUPABASE') &&
    supabaseUrl.startsWith('https://')
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[AgencyOS Supabase] Warning: Missing or invalid VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

/**
 * Singleton Supabase client configured for AgencyOS.
 * Auto-refreshes auth sessions and supports WebSocket Realtime.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
