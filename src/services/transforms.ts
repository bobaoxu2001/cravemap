// src/services/transforms.ts
import type { UserProfile } from '../../types';
import type { ProfileRow } from './types';

const FALLBACK_AVATAR = 'https://picsum.photos/seed/cravemap_user/200/200';

export function profileFromRow(row: ProfileRow): UserProfile {
  const tastePassportComplete = Boolean(row.taste_passport_complete);
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
      verifiedCheckIn: false,
      twoInvites: (row.invite_count ?? 0) >= 2,
    },
  };
}
