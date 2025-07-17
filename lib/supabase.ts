import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

console.log('Supabase URL:', supabaseUrl ? '[REDACTED]' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? '[REDACTED]' : 'Missing');
