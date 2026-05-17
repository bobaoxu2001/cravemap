// src/services/saved.ts
import type { Restaurant } from '../../types';
import { USE_SUPABASE } from './config';
import * as mock from './saved.mock';
import * as supabase from './saved.supabase';

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (__DEV__) {
      console.warn('[CraveMap] Supabase saved request failed. Falling back to mock data.', error);
    }
    return fallback();
  }
}

export function getSavedRestaurants(userId: string): Promise<Restaurant[]> {
  if (!USE_SUPABASE) {
    return mock.getSavedRestaurants(userId);
  }
  return withMockFallback(
    () => supabase.getSavedRestaurants(userId),
    () => mock.getSavedRestaurants(userId)
  );
}

export function isRestaurantSaved(userId: string, restaurantId: string): Promise<boolean> {
  if (!USE_SUPABASE) {
    return mock.isRestaurantSaved(userId, restaurantId);
  }
  return withMockFallback(
    () => supabase.isRestaurantSaved(userId, restaurantId),
    () => mock.isRestaurantSaved(userId, restaurantId)
  );
}

export function saveRestaurant(userId: string, restaurantId: string): Promise<void> {
  if (!USE_SUPABASE) {
    return mock.saveRestaurant(userId, restaurantId);
  }
  return withMockFallback(
    () => supabase.saveRestaurant(userId, restaurantId),
    () => mock.saveRestaurant(userId, restaurantId)
  );
}

export function unsaveRestaurant(userId: string, restaurantId: string): Promise<void> {
  if (!USE_SUPABASE) {
    return mock.unsaveRestaurant(userId, restaurantId);
  }
  return withMockFallback(
    () => supabase.unsaveRestaurant(userId, restaurantId),
    () => mock.unsaveRestaurant(userId, restaurantId)
  );
}
