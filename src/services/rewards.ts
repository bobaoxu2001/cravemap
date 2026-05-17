// src/services/rewards.ts
import type { FoundingScoutProgress, RewardTask } from './types';
import { USE_SUPABASE } from './config';
import * as mock from './rewards.mock';
import * as supabase from './rewards.supabase';

export { calculateProgress } from './rewards.mock';

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (__DEV__) {
      console.warn('[CraveMap] Supabase rewards request failed. Falling back to mock data.', error);
    }
    return fallback();
  }
}

export function getFoundingScoutProgress(userId: string): Promise<FoundingScoutProgress> {
  if (!USE_SUPABASE) {
    return mock.getFoundingScoutProgress(userId);
  }
  return withMockFallback(
    () => supabase.getFoundingScoutProgress(userId),
    () => mock.getFoundingScoutProgress(userId)
  );
}

export function getRewardTasks(userId: string): Promise<RewardTask[]> {
  if (!USE_SUPABASE) {
    return mock.getRewardTasks(userId);
  }
  return withMockFallback(
    () => supabase.getRewardTasks(userId),
    () => mock.getRewardTasks(userId)
  );
}
