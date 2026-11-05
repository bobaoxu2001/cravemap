import { USE_SUPABASE } from './config';
import * as mock from './blocks.mock';
import * as supabase from './blocks.supabase';

/**
 * Add a user to the current user's block list.
 * Their check-ins will be filtered from all feeds on next load.
 */
export function blockUser(blockedUserId: string): Promise<void> {
  if (!USE_SUPABASE) return mock.blockUser(blockedUserId);
  return supabase.blockUser(blockedUserId);
}

/**
 * Return the IDs of all users the current user has blocked.
 * Use this to filter check-in feeds on the client.
 * Never throws — returns [] on failure so feeds still load.
 */
export function getBlockedUserIds(): Promise<string[]> {
  if (!USE_SUPABASE) return mock.getBlockedUserIds();
  return supabase.getBlockedUserIds();
}
