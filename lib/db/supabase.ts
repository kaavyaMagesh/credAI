import { createClient } from '@supabase/supabase-js';

// Polyfill global WebSocket for Node.js < 22 environments (such as GitHub Actions CI)
// to satisfy Supabase's Realtime client initialization checks.
if (typeof global !== 'undefined' && !global.WebSocket) {
  (global as any).WebSocket = class MockWebSocket {};
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    'Warning: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are not set. Database operations will operate in mock offline mode.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

