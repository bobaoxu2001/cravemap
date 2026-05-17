// src/services/types.ts
import type { CheckIn, UserProfile } from '../../types';

// CheckIns
export interface CreateCheckInInput {
  restaurantId: string;
  review: string;
  photos?: string[];
  orderedItems?: string[];
  tasteTags?: string[];
  dietTags?: string[];
  sceneTags?: string[];
  isRepeatVisit?: boolean;
  wouldReturn?: boolean;
  hypeRating: CheckIn['hypeRating'];
  locationVerified?: boolean;
}

// Profile
export interface UpdateTastePassportInput {
  city?: string;
  trustSources?: string[];
  tastePreferences?: string[];
  dislikes?: string[];
  dietNeeds?: string[];
  foodScenes?: string[];
}

export interface UpsertProfileInput {
  id: string;
  name?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  city?: string | null;
  trustSources?: string[];
  tastePreferences?: string[];
  dislikes?: string[];
  dietNeeds?: string[];
  foodScenes?: string[];
  persona?: string | null;
  tastePassportComplete?: boolean;
}

export interface ProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  trust_sources: string[] | null;
  taste_preferences: string[] | null;
  dislikes: string[] | null;
  diet_needs: string[] | null;
  food_scenes: string[] | null;
  taste_passport_complete: boolean | null;
  persona: string | null;
  check_in_count: number | null;
  saved_count: number | null;
  invite_count: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Rewards
export interface FoundingScoutProgress {
  tastePassport: boolean;
  threeCheckIns: boolean;
  verifiedCheckIn: boolean;
  twoInvites: boolean;
  completedCount: number;
  totalCount: number;
  percentComplete: number;
}

export interface RewardTask {
  key: 'tastePassport' | 'threeCheckIns' | 'verifiedCheckIn' | 'twoInvites';
  label: string;
  done: boolean;
  points: number;
}

// Auth
export interface AuthSession {
  userId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  emailConfirmed?: boolean;
}

export type AuthStateChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'MFA_CHALLENGE_VERIFIED';

export interface AuthUserMetadata {
  name: string;
}

export type AuthStateChangeCallback = (
  session: AuthSession | null,
  user: UserProfile | null,
  event: AuthStateChangeEvent
) => void;

export interface AuthSubscription {
  unsubscribe: () => void;
}

// Storage
export interface UploadResult {
  url: string;
  path: string;
}

// Invites
export interface Invite {
  id: string;
  code: string;
  inviteeEmail?: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface InviteStats {
  totalInvites: number;
  acceptedInvites: number;
}
