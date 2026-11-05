// ============================================================================
// CraveMap Studio — merchant status lookup
// ============================================================================
// Lightweight check: does the signed-in user have a merchant_profiles row?
// Used by AuthContext to route returning merchants to /studio/dashboard
// instead of the diner home.
// ============================================================================

import { getSupabaseClient } from '../../lib/supabase';

/**
 * Returns true if the user has a merchant_profiles row.
 * Returns false on any error (no client, RLS denial, network failure) — this
 * is a routing hint, not a security check, so failing closed is safe.
 */
export async function isUserMerchant(userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data, error } = await client
      .from('merchant_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (__DEV__) {
        console.warn('[Studio] isUserMerchant lookup failed:', error.message);
      }
      return false;
    }
    return Boolean(data);
  } catch (err) {
    if (__DEV__) {
      console.warn('[Studio] isUserMerchant threw:', err);
    }
    return false;
  }
}
