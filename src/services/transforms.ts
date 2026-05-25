// src/services/transforms.ts
import type { CheckIn, Restaurant, UserProfile } from '../../types';
import type { CheckInRow, ProfileRow, RestaurantRow } from './types';
import { normalizeRestaurant } from '../lib/restaurantNormalize';

const FALLBACK_AVATAR = 'https://picsum.photos/seed/cravemap_user/200/200';

export function profileFromRow(
  row: ProfileRow,
  /** Derived from a separate query since `profiles` doesn't store this flag. */
  extra?: { verifiedCheckIn?: boolean }
): UserProfile {
  const tastePassportComplete = Boolean(row.taste_passport_complete);
  const verifiedCheckIn = extra?.verifiedCheckIn ?? false;
  return {
    id: row.id,
    name: row.name?.trim() || 'New Foodie',
    avatar: row.avatar_url || FALLBACK_AVATAR,
    city: row.city || 'New York City',
    trustSources: row.trust_sources ?? [],
    tastePreferences: row.taste_preferences ?? [],
    dislikes: row.dislikes ?? [],
    dietNeeds: row.diet_needs ?? [],
    foodScenes: row.food_scenes ?? [],
    checkInCount: row.check_in_count ?? 0,
    savedCount: row.saved_count ?? 0,
    badges: tastePassportComplete
      ? ['Founding Food Scout (Pending)', 'Taste Passport Complete']
      : ['Founding Food Scout (Pending)'],
    persona: row.persona ?? undefined,
    tastePassportComplete,
    foundingScoutProgress: {
      tastePassport: tastePassportComplete,
      threeCheckIns: (row.check_in_count ?? 0) >= 3,
      verifiedCheckIn,
      twoInvites: (row.invite_count ?? 0) >= 2,
    },
  };
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function optionalString(value: string | null | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function restaurantFromRow(row: RestaurantRow): Restaurant {
  const localApprovedPercent = row.local_approved_percent ?? 0;
  const raw: Restaurant = {
    id: row.id,
    name: row.name,
    city: row.city,
    neighborhood: row.neighborhood,
    cuisine: row.cuisine,
    price: row.price,
    tasteMatchPercent: Math.min(localApprovedPercent + 3, 99),
    localApprovedPercent,
    verifiedCheckIns: row.verified_check_ins ?? 0,
    tags: row.tags ?? [],
    recommendationReason: row.recommendation_reason ?? '',
    description: row.description ?? '',
    address: row.address,
    hours: row.hours ?? '',
    phone: optionalString(row.phone),
    website: optionalString(row.website),
    images: row.images ?? [],
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    bestFor: row.best_for ?? [],
    avoidIf: row.avoid_if ?? [],
    categories: row.categories ?? [],
    isOpen: row.is_open ?? true,
    waitTime: optionalString(row.wait_time),
    insiderTip: optionalString(row.insider_tip),
    whatLocalsOrder: row.what_locals_order ?? [],
    bestTimeToGo: optionalString(row.best_time_to_go),
    trendingSignal: row.trending_signal ?? undefined,
    recentVisits: row.recent_visits ?? 0,
  };
  // Trust-tag collapse + local-approved threshold + vibe default.
  // Same normalizer the mock store uses, so dev and prod behave identically.
  return normalizeRestaurant(raw);
}

export function checkInFromRow(row: CheckInRow): CheckIn {
  const rawDate = row.created_at ?? '';
  const date = rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0];
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    userId: row.user_id,
    userName: row.profiles?.name?.trim() || 'CraveMap Scout',
    userAvatar: row.profiles?.avatar_url || FALLBACK_AVATAR,
    date,
    photos: row.photos ?? [],
    review: row.review,
    tasteTags: row.taste_tags ?? [],
    dietTags: row.diet_tags ?? [],
    sceneTags: row.scene_tags ?? [],
    isRepeatVisit: row.is_repeat_visit ?? false,
    hypeRating: row.hype_rating,
    locationVerified: row.location_verified ?? false,
    helpful: row.helpful_count ?? 0,
    wouldReturn: row.would_return ?? undefined,
    orderedItems: (row.ordered_items ?? []).length > 0 ? (row.ordered_items ?? []) : undefined,
  };
}
