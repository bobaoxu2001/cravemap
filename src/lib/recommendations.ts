import type { Restaurant, UserProfile } from '../../types';

function firstOrFallback(values: string[] | undefined, fallback: string): string {
  return values && values.length > 0 ? values[0] : fallback;
}

function waitPenalty(waitTime?: string): number {
  if (!waitTime) return 0;
  const minutes = Number(waitTime.match(/\d+/)?.[0] ?? 0);
  if (minutes >= 60) return 12;
  if (minutes >= 40) return 8;
  if (minutes >= 20) return 4;
  return 0;
}

function scoreRestaurant(restaurant: Restaurant): number {
  const openBonus = restaurant.isOpen ? 14 : -18;
  const recentBonus = Math.min(restaurant.recentVisits ?? 0, 200) / 10;
  const hiddenGemBonus = restaurant.categories.includes('hidden-gems') ? 4 : 0;
  return (
    restaurant.tasteMatchPercent * 0.45 +
    restaurant.localApprovedPercent * 0.35 +
    Math.min(restaurant.verifiedCheckIns, 2000) / 80 +
    recentBonus +
    hiddenGemBonus +
    openBonus -
    waitPenalty(restaurant.waitTime)
  );
}

export function getPrimaryOrder(restaurant: Restaurant): string {
  return firstOrFallback(
    restaurant.whatLocalsOrder,
    firstOrFallback(restaurant.tags, restaurant.cuisine)
  );
}

export function getRecommendationProof(restaurant: Restaurant, profile?: UserProfile | null): string[] {
  const proof = [
    `${restaurant.tasteMatchPercent}% match for your Taste Passport`,
    `${restaurant.localApprovedPercent}% local approval from verified visits`,
  ];

  const matchingTaste = profile?.tastePreferences?.find((taste) => {
    const needle = taste.toLowerCase();
    return [
      restaurant.cuisine,
      ...restaurant.tags,
      ...restaurant.categories,
      ...restaurant.bestFor,
    ].some((value) => value.toLowerCase().includes(needle));
  });

  if (matchingTaste) {
    proof.unshift(`Matches your ${matchingTaste.toLowerCase()} preference`);
  } else if (restaurant.trendingSignal === 'underrated') {
    proof.unshift('Hidden-gem signal: strong approval without hype volume');
  } else if ((restaurant.recentVisits ?? 0) > 0) {
    proof.unshift(`${restaurant.recentVisits} recent visits in the last week`);
  }

  return proof.slice(0, 3);
}

export function getHungryNowPick(
  restaurants: Restaurant[],
  city: string
): Restaurant | null {
  const candidates = restaurants.filter((restaurant) => restaurant.city === city);
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => scoreRestaurant(b) - scoreRestaurant(a))[0];
}

export function getHungryNowReason(restaurant: Restaurant): string {
  const order = getPrimaryOrder(restaurant);
  const wait = restaurant.waitTime ? ` · typical wait ${restaurant.waitTime}` : '';
  return `${restaurant.tasteMatchPercent}% match · order ${order}${wait}`;
}

export function getDecisionHeadline(restaurant: Restaurant): string {
  if (!restaurant.isOpen) return 'Save this for later';
  if (restaurant.waitTime && waitPenalty(restaurant.waitTime) >= 8) return 'Worth it if you can wait';
  if (restaurant.trendingSignal === 'underrated') return 'Go before it gets obvious';
  if (restaurant.tasteMatchPercent >= 94) return 'Strong match for you';
  return 'Reliable pick';
}

// ---------------------------------------------------------------------------
// Taste Passport personalization
// ---------------------------------------------------------------------------
// Computes a per-user `tasteMatchPercent` so the same restaurant scores
// differently for different users — the whole point of the Taste Passport.
// Until now `tasteMatchPercent` was `localApprovedPercent + 3` for everyone,
// which made the headline "X% match for your Taste Passport" misleading.
// ---------------------------------------------------------------------------

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[-_]+/g, ' ').trim();
}

function tokenMatchesAny(needle: string, haystack: string[]): boolean {
  const t = normalizeToken(needle);
  if (!t) return false;
  return haystack.some((h) => normalizeToken(h).includes(t));
}

/**
 * Personalized taste-match score for one (restaurant, profile) pair.
 * Range: 40–99. When the passport isn't complete, returns the previous
 * default (`localApprovedPercent + 3`) so new users see no regression.
 *
 * Adjustments are intentionally modest (±~15 from base) so the number
 * stays plausible while differentiating clearly between users.
 */
export function computeTasteMatch(
  restaurant: Restaurant,
  profile: UserProfile | null | undefined
): number {
  const base = restaurant.localApprovedPercent ?? 70;

  if (!profile?.tastePassportComplete) {
    return Math.min(base + 3, 99);
  }

  // Tokens that describe what the restaurant is — used for positive matching.
  const positiveTokens = [
    restaurant.cuisine,
    ...restaurant.tags,
    ...restaurant.categories,
    ...restaurant.bestFor,
  ];

  // Scene matching is restricted to bestFor + categories (more deliberate).
  const sceneTokens = [...restaurant.bestFor, ...restaurant.categories];

  let adjustment = 3; // mirrors the previous default for unmatched profiles

  // +4 per taste preference the restaurant matches.
  for (const taste of profile.tastePreferences ?? []) {
    if (tokenMatchesAny(taste, positiveTokens)) {
      adjustment += 4;
    }
  }

  // +3 per food scene the restaurant is "best for".
  for (const scene of profile.foodScenes ?? []) {
    if (tokenMatchesAny(scene, sceneTokens)) {
      adjustment += 3;
    }
  }

  // Dislikes — heuristic, signal by signal.
  for (const dislikeRaw of profile.dislikes ?? []) {
    const d = normalizeToken(dislikeRaw);

    // "Too {trait}" — penalize if the trait shows up in cuisine/tags.
    if (d.startsWith('too ')) {
      const trait = d.slice(4);
      if (tokenMatchesAny(trait, [restaurant.cuisine, ...restaurant.tags])) {
        adjustment -= 6;
      }
      continue;
    }

    if (
      d === 'touristy' &&
      (restaurant.trendingSignal === 'classic' || restaurant.trendingSignal === 'trending')
    ) {
      adjustment -= 5;
      continue;
    }
    if (d === 'overhyped' && restaurant.trendingSignal === 'trending') {
      adjustment -= 6;
      continue;
    }
    if (d === 'long wait') {
      const waitMin = Number(restaurant.waitTime?.match(/\d+/)?.[0] ?? 0);
      if (waitMin >= 30) adjustment -= 5;
      continue;
    }
    if (d === 'tiny portions') {
      // No clean signal in the current data model; skip rather than guess.
      continue;
    }

    // Fallback — substring match against tags.
    if (tokenMatchesAny(dislikeRaw, restaurant.tags)) {
      adjustment -= 4;
    }
  }

  return Math.max(40, Math.min(99, Math.round(base + adjustment)));
}

/**
 * Returns a new array of restaurants with `tasteMatchPercent` recomputed
 * against the user's Taste Passport. Pure — does not mutate inputs.
 * If the passport isn't complete the input array is returned unchanged.
 */
export function applyTastePassport(
  restaurants: Restaurant[],
  profile: UserProfile | null | undefined
): Restaurant[] {
  if (!profile?.tastePassportComplete) {
    return restaurants;
  }
  return restaurants.map((r) => ({
    ...r,
    tasteMatchPercent: computeTasteMatch(r, profile),
  }));
}
