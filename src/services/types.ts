// src/services/types.ts
import type { CheckIn, UserProfile } from '../../types';

// CheckIns
export interface CreateCheckInResult extends CheckIn {
  /** Non-fatal warning surfaced to the UI (e.g. partial photo upload failure). */
  warning?: string;
}

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

export interface MarkHelpfulResult {
  success: boolean;
  helpfulCount: number;
  alreadyMarked?: boolean;
  error?: string;
}

export interface CheckInRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  review: string;
  photos: string[] | null;
  ordered_items: string[] | null;
  taste_tags: string[] | null;
  diet_tags: string[] | null;
  scene_tags: string[] | null;
  is_repeat_visit: boolean | null;
  would_return: boolean | null;
  hype_rating: 'worth_it' | 'overhyped' | 'not_sure';
  location_verified: boolean | null;
  helpful_count: number | null;
  created_at: string | null;
  profiles?: {
    name: string | null;
    avatar_url: string | null;
  } | null;
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

// Restaurants
export interface RestaurantRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  cuisine: string;
  price: '$' | '$$' | '$$$' | '$$$$';
  description: string | null;
  recommendation_reason: string | null;
  address: string;
  hours: string | null;
  phone: string | null;
  website: string | null;
  images: string[] | null;
  latitude: number | string;
  longitude: number | string;
  tags: string[] | null;
  categories: string[] | null;
  best_for: string[] | null;
  avoid_if: string[] | null;
  is_open: boolean | null;
  wait_time: string | null;
  insider_tip: string | null;
  what_locals_order: string[] | null;
  best_time_to_go: string | null;
  trending_signal: 'trending' | 'rising' | 'underrated' | 'classic' | null;
  verified_check_ins: number | null;
  local_approved_percent: number | null;
  recent_visits: number | null;
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

export interface RedeemInviteResult {
  success: boolean;
  error?: string;
}
