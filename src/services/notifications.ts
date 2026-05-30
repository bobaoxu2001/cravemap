// Activity feed, derived from real data.
//
// CraveMap has no push-notification backend yet, so the "Activity" screen is
// built from things we genuinely know: the user's own check-ins, their XP /
// level progress, and recent community check-ins in their city. Every row maps
// to a real event with a real timestamp — nothing is invented. A brand-new
// user with no activity gets an empty feed (handled by the screen), not fake
// sample data.

import type { CheckIn, Restaurant, UserProfile } from '../../types';
import { getCheckInsByUserId, getAllCheckIns } from './checkIns';
import { getAllRestaurants } from './restaurants';
import { getPetStats } from './petSystem';

export type NotificationType = 'checkin' | 'xp' | 'helpful' | 'community';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Epoch ms — used for sorting and the relative "time ago" label. */
  timestamp: number;
  unread: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const UNREAD_WINDOW_MS = 3 * DAY_MS;
const COMMUNITY_WINDOW_MS = 14 * DAY_MS;
const MAX_COMMUNITY = 6;

function parseDate(date: string): number {
  const t = Date.parse(date);
  return Number.isFinite(t) ? t : Date.now();
}

function nameFor(map: Map<string, Restaurant>, id: string): string {
  return map.get(id)?.name ?? 'a restaurant';
}

/**
 * Builds the activity feed for one user. Pure aside from the service reads it
 * delegates to; safe to call on focus. Never throws for the empty-data case —
 * it simply returns fewer (or zero) items.
 */
export async function getNotifications(
  userId: string,
  profile: UserProfile | null
): Promise<AppNotification[]> {
  const now = Date.now();
  const [restaurants, myCheckIns, allCheckIns] = await Promise.all([
    getAllRestaurants(),
    getCheckInsByUserId(userId),
    getAllCheckIns(),
  ]);

  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const items: AppNotification[] = [];

  // 1. XP / level progress — a live status row, pinned to "now".
  if (profile) {
    const stats = getPetStats(profile);
    if (!stats.isMaxLevel && stats.nextLevel) {
      items.push({
        id: 'xp-progress',
        type: 'xp',
        title: `You're ${stats.xpToNextLevel} XP from Level ${stats.level + 1} — ${stats.nextLevel.titleZh}`,
        body: 'Post a verified check-in to get there faster.',
        timestamp: now,
        unread: true,
      });
    }
  }

  // 2. The user's own check-ins, plus a "helpful votes" row when earned.
  for (const c of myCheckIns) {
    const ts = parseDate(c.date);
    const place = nameFor(byId, c.restaurantId);
    items.push({
      id: `mine-${c.id}`,
      type: 'checkin',
      title: `Your check-in at ${place}`,
      body: c.review?.trim()
        ? `“${c.review.trim()}”`
        : 'Thanks for shaping the local-approved feed.',
      timestamp: ts,
      unread: now - ts < UNREAD_WINDOW_MS,
    });
    if (c.helpful > 0) {
      items.push({
        id: `helpful-${c.id}`,
        type: 'helpful',
        title: `Your check-in got ${c.helpful} helpful vote${c.helpful === 1 ? '' : 's'}`,
        body: `People are finding your ${place} review useful.`,
        timestamp: ts,
        unread: now - ts < UNREAD_WINDOW_MS,
      });
    }
  }

  // 3. Recent community check-ins (not the user's own) in the same city.
  const city = profile?.city;
  const community = allCheckIns
    .filter((c) => c.userId !== userId)
    .filter((c) => {
      if (!city) return true;
      const r = byId.get(c.restaurantId);
      return !r || r.city === city;
    })
    .filter((c) => now - parseDate(c.date) < COMMUNITY_WINDOW_MS)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))
    .slice(0, MAX_COMMUNITY);

  for (const c of community) {
    const ts = parseDate(c.date);
    const place = nameFor(byId, c.restaurantId);
    const verdict =
      c.hypeRating === 'worth_it' ? 'Worth it ✅'
      : c.hypeRating === 'overhyped' ? 'Overhyped 🚫'
      : 'Not sure 🤔';
    items.push({
      id: `community-${c.id}`,
      type: 'community',
      title: `${c.userName} checked in at ${place}`,
      body: c.review?.trim() ? `“${c.review.trim()}” — ${verdict}` : verdict,
      timestamp: ts,
      unread: now - ts < UNREAD_WINDOW_MS,
    });
  }

  return items.sort((a, b) => b.timestamp - a.timestamp);
}

/** Human-friendly relative time for a feed timestamp. */
export function timeAgo(timestamp: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
