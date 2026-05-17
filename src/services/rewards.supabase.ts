import { getSupabaseClient } from '../lib/supabase';
import type { FoundingScoutProgress, RewardTask } from './types';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or run in mock mode.'
    );
  }
  return client;
}

interface FoundingScoutRow {
  user_id: string;
  taste_passport: boolean | null;
  three_check_ins: boolean | null;
  verified_check_in: boolean | null;
  two_invites: boolean | null;
}

export async function getFoundingScoutProgress(userId: string): Promise<FoundingScoutProgress> {
  const { data, error } = await requireClient()
    .from('founding_scout_progress')
    .select('user_id, taste_passport, three_check_ins, verified_check_in, two_invites')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to load Founding Scout progress.');
  }

  const row = data as unknown as FoundingScoutRow;
  const tastePassport = row.taste_passport ?? false;
  const threeCheckIns = row.three_check_ins ?? false;
  const verifiedCheckIn = row.verified_check_in ?? false;
  const twoInvites = row.two_invites ?? false;
  const completedCount = [tastePassport, threeCheckIns, verifiedCheckIn, twoInvites].filter(Boolean).length;
  const totalCount = 4;

  return {
    tastePassport,
    threeCheckIns,
    verifiedCheckIn,
    twoInvites,
    completedCount,
    totalCount,
    percentComplete: completedCount / totalCount,
  };
}

export async function getRewardTasks(userId: string): Promise<RewardTask[]> {
  const progress = await getFoundingScoutProgress(userId);
  return [
    { key: 'tastePassport', label: 'Complete Taste Passport', done: progress.tastePassport, points: 50 },
    { key: 'threeCheckIns', label: 'Post 3 real check-ins', done: progress.threeCheckIns, points: 150 },
    { key: 'verifiedCheckIn', label: 'Get 1 location-verified check-in', done: progress.verifiedCheckIn, points: 100 },
    { key: 'twoInvites', label: 'Invite 2 friends', done: progress.twoInvites, points: 100 },
  ];
}
