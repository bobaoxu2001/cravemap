import type { Restaurant } from '../../types';
import { getSupabaseClient } from '../lib/supabase';
import { restaurantFromRow } from './transforms';
import type { RestaurantRow } from './types';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or run in mock mode.'
    );
  }
  return client;
}

function getErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  return message || 'Restaurant request failed. Please try again.';
}

type RestaurantQuery = any;

function baseQuery(): RestaurantQuery {
  return requireClient()
    .from('restaurants')
    .select('*')
    .order('local_approved_percent', { ascending: false })
    .order('verified_check_ins', { ascending: false });
}

function withCity(query: RestaurantQuery, city?: string): RestaurantQuery {
  return city ? query.eq('city', city) : query;
}

async function execute(query: RestaurantQuery): Promise<Restaurant[]> {
  const { data, error } = await query;
  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  return ((data ?? []) as RestaurantRow[]).map(restaurantFromRow);
}

export function getAllRestaurants(): Promise<Restaurant[]> {
  return execute(baseQuery());
}

export function getRestaurantsByCity(city: string): Promise<Restaurant[]> {
  return execute(withCity(baseQuery(), city));
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const { data, error } = await requireClient()
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  return data ? restaurantFromRow(data as RestaurantRow) : null;
}

export function getRestaurantsByCategory(
  category: string,
  city?: string
): Promise<Restaurant[]> {
  return execute(withCity(baseQuery().contains('categories', [category]), city));
}

export function getTrendingRestaurants(city?: string): Promise<Restaurant[]> {
  return execute(
    withCity(baseQuery().in('trending_signal', ['trending', 'rising']), city)
  );
}

export function getHiddenGemRestaurants(city?: string): Promise<Restaurant[]> {
  return execute(
    withCity(
      baseQuery().or('trending_signal.eq.underrated,verified_check_ins.lt.600'),
      city
    )
  );
}

export function searchRestaurants(
  query: string,
  city?: string
): Promise<Restaurant[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return city ? getRestaurantsByCity(city) : getAllRestaurants();
  }

  const normalized = trimmed.toLowerCase();
  const load = city ? getRestaurantsByCity(city) : getAllRestaurants();
  return load.then((restaurants) =>
    restaurants.filter((restaurant) => {
      const searchable = [
        restaurant.name,
        restaurant.cuisine,
        restaurant.neighborhood,
        ...restaurant.tags,
        ...restaurant.categories,
      ];
      return searchable.some((value) => value.toLowerCase().includes(normalized));
    })
  );
}
