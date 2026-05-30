// src/services/invites.ts
import type { Invite, InviteStats, RedeemInviteResult } from './types';
import { USE_SUPABASE } from './config';
import * as mock from './invites.mock';
import * as supabase from './invites.supabase';

// On a transient Supabase read failure for an authenticated user we degrade to
// an empty result, NOT the mock/demo user's invites — showing the demo user's
// invite stats as "yours" is a correctness bug. Mock data is only used in
// explicit demo mode (`!USE_SUPABASE`).
async function withEmptyFallback<T>(request: () => Promise<T>, empty: T, label: string): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (__DEV__) {
      console.warn(`[CraveMap] Supabase ${label} read failed; returning empty.`, error);
    }
    return empty;
  }
}

export function createInvite(inviteeEmail?: string): Promise<Invite> {
  if (!USE_SUPABASE) {
    return mock.createInvite(inviteeEmail);
  }
  // Write — do not fall back silently; let caller handle error.
  return supabase.createInvite(inviteeEmail);
}

export function getInviteStats(userId: string): Promise<InviteStats> {
  if (!USE_SUPABASE) {
    return mock.getInviteStats(userId);
  }
  return withEmptyFallback(
    () => supabase.getInviteStats(userId),
    { totalInvites: 0, acceptedInvites: 0 },
    'invite stats'
  );
}

export function getMyInvites(userId: string): Promise<Invite[]> {
  if (!USE_SUPABASE) {
    return mock.getMyInvites(userId);
  }
  return withEmptyFallback(
    () => supabase.getMyInvites(userId),
    [],
    'my invites'
  );
}

export function redeemInvite(userId: string, code: string): Promise<RedeemInviteResult> {
  if (!USE_SUPABASE) {
    return mock.redeemInvite(userId, code);
  }
  // Write — do not fall back silently; surface errors to the caller.
  return supabase.redeemInvite(userId, code);
}
