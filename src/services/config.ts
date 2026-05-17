import { isSupabaseConfigured } from '../lib/supabase';

export const USE_SUPABASE = isSupabaseConfigured();

if (__DEV__ && !USE_SUPABASE) {
  console.log(
    '[CraveMap] Running in MOCK mode. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to enable Supabase.'
  );
}
