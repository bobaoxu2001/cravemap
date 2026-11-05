import { getSupabaseClient } from '../lib/supabase';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');
  return client;
}

export async function blockUser(blockedUserId: string): Promise<void> {
  const client = requireClient();
  const { data, error } = await client.rpc('block_user', {
    p_blocked_id: blockedUserId,
  });
  if (error) {
    throw new Error(error.message || 'Could not block user.');
  }
  const result = data as { success: boolean; error?: string } | null;
  if (result && !result.success) {
    throw new Error(result.error ?? 'Could not block user.');
  }
}

export async function getBlockedUserIds(): Promise<string[]> {
  const client = requireClient();
  const { data, error } = await client.rpc('get_blocked_user_ids');
  if (error) {
    // Non-fatal: if this fails, just return empty list so feeds still load.
    if (__DEV__) console.warn('[CraveMap] getBlockedUserIds failed:', error.message);
    return [];
  }
  return (data as string[]) ?? [];
}
