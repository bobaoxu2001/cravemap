// src/services/checkIns.ts
import type { CheckIn } from '../../types';
import { USE_SUPABASE } from './config';
import * as mock from './checkIns.mock';
import * as supabase from './checkIns.supabase';
import type { CreateCheckInInput, CreateCheckInResult } from './types';

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (__DEV__) {
      console.warn('[CraveMap] Supabase check-in request failed. Falling back to mock data.', error);
    }
    return fallback();
  }
}

export function getAllCheckIns(): Promise<CheckIn[]> {
  if (!USE_SUPABASE) {
    return mock.getAllCheckIns();
  }
  return withMockFallback(
    () => supabase.getAllCheckIns(),
    () => mock.getAllCheckIns()
  );
}

export function getCheckInsByRestaurantId(restaurantId: string): Promise<CheckIn[]> {
  if (!USE_SUPABASE) {
    return mock.getCheckInsByRestaurantId(restaurantId);
  }
  return withMockFallback(
    () => supabase.getCheckInsByRestaurantId(restaurantId),
    () => mock.getCheckInsByRestaurantId(restaurantId)
  );
}

export function getCheckInsByUserId(userId: string): Promise<CheckIn[]> {
  if (!USE_SUPABASE) {
    return mock.getCheckInsByUserId(userId);
  }
  return withMockFallback(
    () => supabase.getCheckInsByUserId(userId),
    () => mock.getCheckInsByUserId(userId)
  );
}

export function createCheckIn(input: CreateCheckInInput): Promise<CreateCheckInResult> {
  if (!USE_SUPABASE) {
    return mock.createCheckIn(input);
  }
  // Do not fall back to mock on write failures — let the caller handle the error.
  return supabase.createCheckIn(input);
}

export function markHelpful(checkInId: string): Promise<void> {
  if (!USE_SUPABASE) {
    return mock.markHelpful(checkInId);
  }
  return withMockFallback(
    () => supabase.markHelpful(checkInId),
    () => mock.markHelpful(checkInId)
  );
}
