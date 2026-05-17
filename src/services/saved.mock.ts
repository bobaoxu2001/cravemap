import type { Restaurant } from '../../types';
import { mockRestaurants } from '../../data/mockRestaurants';

// In-memory mock set. Resets on app reload — acceptable for mock mode.
const savedIds = new Set<string>([
  'r001',
  'r009',
  'r011',
  'r014',
  'r021',
  'r025',
]);

export function getSavedRestaurants(_userId: string): Promise<Restaurant[]> {
  return Promise.resolve(mockRestaurants.filter((r) => savedIds.has(r.id)));
}

export function isRestaurantSaved(
  _userId: string,
  restaurantId: string
): Promise<boolean> {
  return Promise.resolve(savedIds.has(restaurantId));
}

export function saveRestaurant(
  _userId: string,
  restaurantId: string
): Promise<void> {
  savedIds.add(restaurantId);
  return Promise.resolve();
}

export function unsaveRestaurant(
  _userId: string,
  restaurantId: string
): Promise<void> {
  savedIds.delete(restaurantId);
  return Promise.resolve();
}
