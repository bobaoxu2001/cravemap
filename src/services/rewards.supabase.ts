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

const DEFAULT_PROGRESS: FoundingScoutProgress = {
  tastePassport: false,
  threeCheckIns: false,
  verifiedCheckIn: false,
  twoInvites: false,
  completedCount: 0,
  totalCount: 4,
  percentComplete: 0,
};

interface FoundingScoutRow {
  user_id: string;
  taste_passport: boolean | null;
  three_check_ins: boolean | null;
  verified_check_in: boolean | null;
  two_invites: boolean | null;
}

export async function getFoundingScoutProgress(userId: string): Promise<FoundingScoutProgress> {
  try {
    const { data, error } = await requireClient()
      .from('founding_scout_progress')
      .select('user_id, taste_passport, three_check_ins, verified_check_in, two_invites')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (__DEV__) {
        console.warn('[CraveMap] getFoundingScoutProgress failed:', error.message);
      }
      return DEFAULT_PROGRESS;
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
  } catch (err) {
    if (__DEV__) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[CraveMap] getFoundingScoutProgress threw unexpectedly:', msg);
    }
    return DEFAULT_PROGRESS;
  }
}

export async function getRewardTasks(userId: string): Promise<RewardTask[]> {
  let progress: FoundingScoutProgress;
  try {
    progress = await getFoundingScoutProgress(userId);
  } catch {
    progress = DEFAULT_PROGRESS;
  }
  return [
    { key: 'tastePassport', label: 'Complete Taste Passport', done: progress.tastePassport, points: 50 },
    { key: 'threeCheckIns', label: 'Post 3 real check-ins', done: progress.threeCheckIns, points: 150 },
    { key: 'verifiedCheckIn', label: 'Get 1 location-verified check-in', done: progress.verifiedCheckIn, points: 100 },
    { key: 'twoInvites', label: 'Invite 2 friends', done: progress.twoInvites, points: 100 },
  ];
}
