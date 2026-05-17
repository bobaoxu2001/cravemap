// src/services/restaurants.ts
import type { Restaurant } from '../../types';
import { USE_SUPABASE } from './config';
import * as mock from './restaurants.mock';
import * as supabase from './restaurants.supabase';

const impl = USE_SUPABASE ? supabase : mock;

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (__DEV__) {
      console.warn('[CraveMap] Supabase restaurant fetch failed. Falling back to mock data.', error);
    }
    return fallback();
  }
}

export function getAllRestaurants(): Promise<Restaurant[]> {
  if (!USE_SUPABASE) {
    return mock.getAllRestaurants();
  }
  return withMockFallback(impl.getAllRestaurants, mock.getAllRestaurants);
}

export function getRestaurantsByCity(city: string): Promise<Restaurant[]> {
  if (!USE_SUPABASE) {
    return mock.getRestaurantsByCity(city);
  }
  return withMockFallback(
    () => impl.getRestaurantsByCity(city),
    () => mock.getRestaurantsByCity(city)
  );
}

export function getRestaurantById(id: string): Promise<Restaurant | null> {
  if (!USE_SUPABASE) {
    return mock.getRestaurantById(id);
  }
  return withMockFallback(
    () => impl.getRestaurantById(id),
    () => mock.getRestaurantById(id)
  );
}

export function getRestaurantsByCategory(
  category: string,
  city?: string
): Promise<Restaurant[]> {
  if (!USE_SUPABASE) {
    return mock.getRestaurantsByCategory(category, city);
  }
  return withMockFallback(
    () => impl.getRestaurantsByCategory(category, city),
    () => mock.getRestaurantsByCategory(category, city)
  );
}

export function getTrendingRestaurants(city?: string): Promise<Restaurant[]> {
  if (!USE_SUPABASE) {
    return mock.getTrendingRestaurants(city);
  }
  return withMockFallback(
    () => impl.getTrendingRestaurants(city),
    () => mock.getTrendingRestaurants(city)
  );
}

export function getHiddenGemRestaurants(city?: string): Promise<Restaurant[]> {
  if (!USE_SUPABASE) {
    return mock.getHiddenGemRestaurants(city);
  }
  return withMockFallback(
    () => impl.getHiddenGemRestaurants(city),
    () => mock.getHiddenGemRestaurants(city)
  );
}

export function searchRestaurants(
  query: string,
  city?: string
): Promise<Restaurant[]> {
  if (!USE_SUPABASE) {
    return mock.searchRestaurants(query, city);
  }
  return withMockFallback(
    () => impl.searchRestaurants(query, city),
    () => mock.searchRestaurants(query, city)
  );
}
