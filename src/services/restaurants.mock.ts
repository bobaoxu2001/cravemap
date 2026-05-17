import type { Restaurant } from '../../types';
import { mockRestaurants } from '../../data/mockRestaurants';

export function getAllRestaurants(): Promise<Restaurant[]> {
  return Promise.resolve(mockRestaurants);
}

export function getRestaurantsByCity(city: string): Promise<Restaurant[]> {
  return Promise.resolve(mockRestaurants.filter((r) => r.city === city));
}

export function getRestaurantById(id: string): Promise<Restaurant | null> {
  const found = mockRestaurants.find((r) => r.id === id);
  return Promise.resolve(found ?? null);
}

export function getRestaurantsByCategory(
  category: string,
  city?: string
): Promise<Restaurant[]> {
  let results = mockRestaurants.filter((r) => r.categories.includes(category));
  if (city) {
    results = results.filter((r) => r.city === city);
  }
  return Promise.resolve(results);
}

export function getTrendingRestaurants(city?: string): Promise<Restaurant[]> {
  let results = mockRestaurants.filter(
    (r) => r.trendingSignal === 'trending' || r.trendingSignal === 'rising'
  );
  if (city) {
    results = results.filter((r) => r.city === city);
  }
  return Promise.resolve(results);
}

export function getHiddenGemRestaurants(city?: string): Promise<Restaurant[]> {
  let results = mockRestaurants.filter(
    (r) => r.trendingSignal === 'underrated' || r.verifiedCheckIns < 600
  );
  if (city) {
    results = results.filter((r) => r.city === city);
  }
  return Promise.resolve(results);
}

export function searchRestaurants(
  query: string,
  city?: string
): Promise<Restaurant[]> {
  const q = query.toLowerCase();
  let results = mockRestaurants.filter((r) => {
    return (
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      r.neighborhood.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
  if (city) {
    results = results.filter((r) => r.city === city);
  }
  return Promise.resolve(results);
}
