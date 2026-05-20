import { USE_SUPABASE } from './config';
import * as mock from './account.mock';
import * as supabase from './account.supabase';

/**
 * Permanently deletes the authenticated user's account and all data.
 * The caller is responsible for signing out and clearing navigation state
 * after this resolves.
 *
 * In Mock mode: resolves immediately (no real data to delete).
 * In Supabase mode: calls the `delete_account` RPC which cascades the deletion.
 */
export function deleteAccount(): Promise<void> {
  if (!USE_SUPABASE) {
    return mock.deleteAccount();
  }
  // Destructive write — do not fall back silently.
  return supabase.deleteAccount();
}
