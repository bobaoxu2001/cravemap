// Restaurant data normalizer — runs on every load (mock + Supabase).
//
// Why this exists rather than fixing the source data: across 32 restaurants
// in two stores (data/mockRestaurants.ts + supabase/seed.sql) the legacy
// `categories` field accumulated overlapping trust tags (a single row would
// have local-approved + culture-approved + hidden-gems + anti-hype, which
// meant the tag was no longer a signal). Fixing 32×2 rows by hand bloats
// diffs and re-introduces drift between dev and prod. Instead, normalize
// on read — one canonical place, easy to evolve.
//
// What it does:
//   1. Collapse trust tags: keep AT MOST ONE of
//      {hidden-gems, culture-approved, anti-hype, local-approved}, picked
//      by precedence below. Occasion tags (date-night, group-dinner, etc.)
//      pass through untouched.
//   2. Strip `local-approved` if localApprovedPercent < 90 — the badge
//      was on 27/32 restaurants before this rule, which made it noise.
//   3. Default `vibe` if absent — derive from price + checkin count +
//      occasion tags. Authoring per-restaurant overrides the heuristic.

import type { Restaurant } from '../../types';

// Hidden gem wins over cultural endorsement wins over anti-hype wins
// over the generic local-approved badge. The first one present in the
// original array is the only one that survives.
const TRUST_TAG_PRECEDENCE = [
  'hidden-gems',
  'culture-approved',
  'anti-hype',
  'local-approved',
] as const;
const TRUST_TAGS = new Set<string>(TRUST_TAG_PRECEDENCE);

const LOCAL_APPROVED_THRESHOLD = 90; // percent

function pickTrustTag(categories: string[], localApprovedPercent: number): string | null {
  for (const candidate of TRUST_TAG_PRECEDENCE) {
    if (!categories.includes(candidate)) continue;
    // The local-approved badge is overused unless the restaurant clears
    // the percentile bar. Fall through to a more specific tag if any.
    if (candidate === 'local-approved' && localApprovedPercent < LOCAL_APPROVED_THRESHOLD) {
      return null;
    }
    return candidate;
  }
  return null;
}

function inferVibe(restaurant: Restaurant): Restaurant['vibe'] {
  const cats = restaurant.categories ?? [];
  if (restaurant.price === '$$$' || restaurant.price === '$$$$') return 'upscale';
  if (cats.includes('group-dinner') || cats.includes('late-night')) return 'lively';
  if (restaurant.price === '$' && (restaurant.verifiedCheckIns ?? 0) < 500) {
    return 'hole-in-the-wall';
  }
  return 'casual';
}

/**
 * Normalize a single restaurant. Pure — does not mutate input.
 * Runs as the last step of restaurant load (mock + Supabase).
 */
export function normalizeRestaurant(r: Restaurant): Restaurant {
  const originalCategories = r.categories ?? [];
  const trustTag = pickTrustTag(originalCategories, r.localApprovedPercent ?? 0);
  const nonTrust = originalCategories.filter((c) => !TRUST_TAGS.has(c));
  const newCategories = trustTag ? [trustTag, ...nonTrust] : nonTrust;

  return {
    ...r,
    categories: newCategories,
    vibe: r.vibe ?? inferVibe(r),
  };
}

export function normalizeRestaurants(list: Restaurant[]): Restaurant[] {
  return list.map(normalizeRestaurant);
}
