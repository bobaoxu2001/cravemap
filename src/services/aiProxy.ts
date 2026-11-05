import { getSupabaseClient } from '../lib/supabase';

/** Only a user's short-lived session token enters the app; provider keys stay server-side. */
export async function aiProxyCredentials(): Promise<{ url: string; headers: Record<string, string> }> {
  const client = getSupabaseClient();
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!client || !base) throw new Error('Sign in to use the AI service.');
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Sign in to use the AI service.');
  return {
    url: `${base.replace(/\/$/, '')}/functions/v1/ai-proxy`,
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  };
}
