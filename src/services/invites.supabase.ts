import { getSupabaseClient } from '../lib/supabase';
import type { Invite, InviteStats, RedeemInviteResult } from './types';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or run in mock mode.'
    );
  }
  return client;
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CRAVE-${suffix}`;
}

interface InviteRow {
  id: string;
  code: string;
  invitee_email: string | null;
  accepted_at: string | null;
  accepted_by_user_id: string | null;
  created_at: string;
}

interface RedeemInviteRpcResponse {
  success: boolean;
  error?: string;
}

function isRedeemRpcResponse(value: unknown): value is RedeemInviteRpcResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { success?: unknown }).success === 'boolean'
  );
}

function rowToInvite(row: InviteRow): Invite {
  return {
    id: row.id,
    code: row.code,
    inviteeEmail: row.invitee_email ?? undefined,
    acceptedAt: row.accepted_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function createInvite(inviteeEmail?: string): Promise<Invite> {
  const client = requireClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be signed in to create an invite.');
  }

  const code = generateCode();
  const { data, error } = await client
    .from('invites')
    .insert({
      inviter_id: user.id,
      code,
      invitee_email: inviteeEmail ?? null,
    })
    .select('id, code, invitee_email, accepted_at, created_at')
    .single();

  if (error) {
    throw new Error(error.message || 'Could not create invite.');
  }
  return rowToInvite(data as unknown as InviteRow);
}

export async function getInviteStats(userId: string): Promise<InviteStats> {
  if (!userId) return { totalInvites: 0, acceptedInvites: 0 };

  const { data, error } = await requireClient()
    .from('invites')
    .select('id, accepted_at')
    .eq('inviter_id', userId);

  if (error) {
    throw new Error(error.message || 'Could not load invite stats.');
  }
  const rows = (data ?? []) as Array<{ id: string; accepted_at: string | null }>;
  return {
    totalInvites: rows.length,
    acceptedInvites: rows.filter((r) => r.accepted_at != null).length,
  };
}

export async function getMyInvites(userId: string): Promise<Invite[]> {
  if (!userId) return [];

  const { data, error } = await requireClient()
    .from('invites')
    .select('id, code, invitee_email, accepted_at, created_at')
    .eq('inviter_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Could not load invites.');
  }
  return ((data ?? []) as unknown as InviteRow[]).map(rowToInvite);
}

export async function redeemInvite(userId: string, code: string): Promise<RedeemInviteResult> {
  if (!userId) {
    return { success: false, error: 'You must be signed in to redeem an invite.' };
  }

  const normalised = code.trim().toUpperCase();
  if (!normalised) {
    return { success: false, error: 'Please enter an invite code.' };
  }

  // Delegate to the security-definer RPC. The function uses auth.uid() to
  // identify the redeemer, validates the code, prevents self/double
  // redemption, marks accepted_at + accepted_by_user_id, and the
  // bump_invite_count_on_accept trigger updates the inviter's
  // founding_scout_progress.two_invites flag.
  const { data, error } = await requireClient().rpc('redeem_invite', { p_code: normalised });

  if (error) {
    return { success: false, error: error.message || 'Could not redeem invite. Please try again.' };
  }

  if (!isRedeemRpcResponse(data)) {
    return { success: false, error: 'Could not redeem invite. Please try again.' };
  }

  return data.success
    ? { success: true }
    : { success: false, error: data.error ?? 'Could not redeem invite. Please try again.' };
}
