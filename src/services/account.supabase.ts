import { getSupabaseClient } from '../lib/supabase';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }
  return client;
}

/**
 * Permanently deletes the authenticated user's account and ALL associated
 * data via the `delete_account` security-definer RPC.
 *
 * The RPC deletes the row from `auth.users`, which cascades:
 *   auth.users → public.profiles → check_ins, saved_restaurants,
 *   check_in_helpful, invites, blocked_users, reports
 *
 * The caller must sign the user out and clear local state after this returns.
 */
export async function deleteAccount(): Promise<void> {
  const client = requireClient();
  const { error } = await client.rpc('delete_account');
  if (error) {
    throw new Error(error.message || 'Could not delete account. Please try again.');
  }
}
