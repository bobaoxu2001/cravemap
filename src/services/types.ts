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
