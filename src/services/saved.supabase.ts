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
  return message || 'Saved restaurants request failed. Please try again.';
}

interface SavedRow {
  restaurant_id: string;
  restaurants: RestaurantRow;
}

export async function getSavedRestaurants(userId: string): Promise<Restaurant[]> {
  const { data, error } = await requireClient()
    .from('saved_restaurants')
    .select('restaurant_id, restaurants(*)')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }

  return ((data ?? []) as unknown as SavedRow[])
    .filter((row) => row.restaurants != null)
    .map((row) => restaurantFromRow(row.restaurants));
}

export async function isRestaurantSaved(
  userId: string,
  restaurantId: string
): Promise<boolean> {
  const { data, error } = await requireClient()
    .from('saved_restaurants')
    .select('restaurant_id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  return data !== null;
}

export async function saveRestaurant(
  userId: string,
  restaurantId: string
): Promise<void> {
  const { error } = await requireClient()
    .from('saved_restaurants')
    .upsert(
      { user_id: userId, restaurant_id: restaurantId },
      { onConflict: 'user_id,restaurant_id' }
    );

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
}

export async function unsaveRestaurant(
  userId: string,
  restaurantId: string
): Promise<void> {
  const { error } = await requireClient()
    .from('saved_restaurants')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
}
