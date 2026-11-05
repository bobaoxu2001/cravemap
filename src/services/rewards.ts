// src/services/rewards.ts
import type { FoundingScoutProgress, RewardTask } from './types';
import { USE_SUPABASE } from './config';
import * as mock from './rewards.mock';
import * as supabase from './rewards.supabase';

export { calculateProgress } from './rewards.mock';

// On a transient Supabase read failure for an authenticated user we degrade to
// a *neutral empty* result, NOT the mock/demo user's data — showing someone
// else's reward progress as if it were the current user's is worse than showing
// nothing. Mock data is only used in explicit demo mode (`!USE_SUPABASE`).
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

const EMPTY_PROGRESS: FoundingScoutProgress = {
  tastePassport: false,
  threeCheckIns: false,
  verifiedCheckIn: false,
  twoInvites: false,
  completedCount: 0,
  totalCount: 4,
  percentComplete: 0,
};

export function getFoundingScoutProgress(userId: string): Promise<FoundingScoutProgress> {
  if (!USE_SUPABASE) {
    return mock.getFoundingScoutProgress(userId);
  }
  return withEmptyFallback(
    () => supabase.getFoundingScoutProgress(userId),
    EMPTY_PROGRESS,
    'rewards progress'
  );
}

export function getRewardTasks(userId: string): Promise<RewardTask[]> {
  if (!USE_SUPABASE) {
    return mock.getRewardTasks(userId);
  }
  return withEmptyFallback(
    () => supabase.getRewardTasks(userId),
    [],
    'reward tasks'
  );
}
