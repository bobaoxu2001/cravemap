// src/services/saved.ts
import type { Restaurant } from '../../types';
import { USE_SUPABASE } from './config';
import * as mock from './saved.mock';
import * as supabase from './saved.supabase';

// On a transient Supabase read failure for an authenticated user we degrade to
// an empty result, NOT the mock/demo user's saved list — showing the demo
// user's saved restaurants as "yours" is a correctness bug. Mock data is only
// used in explicit demo mode (`!USE_SUPABASE`).
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

export function getSavedRestaurants(userId: string): Promise<Restaurant[]> {
  if (!USE_SUPABASE) {
    return mock.getSavedRestaurants(userId);
  }
  return withEmptyFallback(
    () => supabase.getSavedRestaurants(userId),
    [],
    'saved restaurants'
  );
}

export function isRestaurantSaved(userId: string, restaurantId: string): Promise<boolean> {
  if (!USE_SUPABASE) {
    return mock.isRestaurantSaved(userId, restaurantId);
  }
  return withEmptyFallback(
    () => supabase.isRestaurantSaved(userId, restaurantId),
    false,
    'saved status'
  );
}

export function saveRestaurant(userId: string, restaurantId: string): Promise<void> {
  if (!USE_SUPABASE) {
    return mock.saveRestaurant(userId, restaurantId);
  }
  // Write — do not fall back silently; surface errors to the caller.
  return supabase.saveRestaurant(userId, restaurantId);
}

export function unsaveRestaurant(userId: string, restaurantId: string): Promise<void> {
  if (!USE_SUPABASE) {
    return mock.unsaveRestaurant(userId, restaurantId);
  }
  // Write — do not fall back silently; surface errors to the caller.
  return supabase.unsaveRestaurant(userId, restaurantId);
}
