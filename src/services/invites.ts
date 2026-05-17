// src/services/invites.ts
import type { Invite, InviteStats } from './types';
import { USE_SUPABASE } from './config';
import * as mock from './invites.mock';
import * as supabase from './invites.supabase';

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (__DEV__) {
      console.warn('[CraveMap] Supabase invites request failed. Falling back to mock data.', error);
    }
    return fallback();
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
  return withMockFallback(
    () => supabase.getInviteStats(userId),
    () => mock.getInviteStats(userId)
  );
}

export function getMyInvites(userId: string): Promise<Invite[]> {
  if (!USE_SUPABASE) {
    return mock.getMyInvites(userId);
  }
  return withMockFallback(
    () => supabase.getMyInvites(userId),
    () => mock.getMyInvites(userId)
  );
}
