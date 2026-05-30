// Daily visit streak — persisted via SecureStore so it survives app restarts.
// Calling recordVisit() on each app open advances the streak when at least
// one full calendar day has passed since the last visit. Two or more missed
// days reset the streak back to 1.
//
// All reads/writes are non-blocking; errors are swallowed so a SecureStore
// failure never crashes the app or blocks the loading flow.

import * as SecureStore from 'expo-secure-store';

const KEY = 'cravemap_streak_v1';

interface StreakData {
  count: number;
  lastDateStr: string; // 'YYYY-MM-DD' in local time
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

async function read(): Promise<StreakData | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StreakData;
  } catch {
    return null;
  }
}

async function write(data: StreakData): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(data));
  } catch {
    // Non-fatal
  }
}

/**
 * Must be called once per app session (e.g. from the home screen on focus).
 * Returns the new streak count after recording today's visit.
 */
export async function recordVisit(): Promise<number> {
  const today = todayStr();
  const stored = await read();

  if (!stored) {
    await write({ count: 1, lastDateStr: today });
    return 1;
  }

  if (stored.lastDateStr === today) {
    // Already recorded today.
    return stored.count;
  }

  const diff = daysBetween(stored.lastDateStr, today);
  const newCount = diff === 1 ? stored.count + 1 : 1;
  await write({ count: newCount, lastDateStr: today });
  return newCount;
}

/** Returns the current streak without modifying it. Useful for display-only. */
export async function getStreak(): Promise<number> {
  const stored = await read();
  if (!stored) return 0;
  // If the user missed a day, streak expired.
  const diff = daysBetween(stored.lastDateStr, todayStr());
  return diff <= 1 ? stored.count : 0;
}

export function streakLabel(count: number): string | null {
  if (count < 2) return null;
  if (count >= 30) return `🔥 ${count} day streak — legendary!`;
  if (count >= 14) return `🔥 ${count} day streak — on fire!`;
  if (count >= 7) return `🔥 ${count} day streak — nice!`;
  return `🔥 ${count} day streak`;
}
