import type {
  AuthChangeEvent,
  Session as SupabaseSession,
  User as SupabaseUser,
} from '@supabase/auth-js';
import type { UserProfile } from '../../types';
import { getSupabaseClient } from '../lib/supabase';
import type {
  AuthSession,
  AuthStateChangeCallback,
  AuthStateChangeEvent,
  AuthSubscription,
  AuthUserMetadata,
} from './types';

const FALLBACK_AVATAR = 'https://picsum.photos/seed/cravemap_user/200/200';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or run in mock mode.'
    );
  }
  return client;
}

function normalizeEmail(email?: string | null): string {
  return email?.trim().toLowerCase() ?? '';
}

function userNameFrom(user: SupabaseUser): string {
  const name = user.user_metadata?.name;
  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }
  const email = normalizeEmail(user.email);
  return email ? email.split('@')[0] : 'New Foodie';
}

function toAuthSession(session: SupabaseSession | null): AuthSession | null {
  if (!session?.user) {
    return null;
  }
  return {
    userId: session.user.id,
    email: normalizeEmail(session.user.email),
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    emailConfirmed: Boolean(session.user.email_confirmed_at),
  };
}

function toUserProfile(user: SupabaseUser | null): UserProfile | null {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    name: userNameFrom(user),
    avatar:
      typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : FALLBACK_AVATAR,
    city:
      typeof user.user_metadata?.city === 'string'
        ? user.user_metadata.city
        : 'New York City',
    trustSources: [],
    tastePreferences: [],
    dislikes: [],
    dietNeeds: [],
    foodScenes: [],
    checkInCount: 0,
    savedCount: 0,
    badges: [],
    tastePassportComplete: false,
    foundingScoutProgress: {
      tastePassport: false,
      threeCheckIns: false,
      verifiedCheckIn: false,
      twoInvites: false,
    },
  };
}

function getErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('password')) {
    return message;
  }
  if (lower.includes('email')) {
    return message;
  }
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  return message || 'Authentication failed. Please try again.';
}

export async function getSession(): Promise<AuthSession | null> {
  const client = requireClient();
  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  return toAuthSession(data.session);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) {
    if (error.message.toLowerCase().includes('auth session missing')) {
      return null;
    }
    throw new Error(getErrorMessage(error.message));
  }
  return toUserProfile(data.user);
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthSession> {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  const session = toAuthSession(data.session);
  if (!session) {
    throw new Error('No session returned. Please confirm your email, then sign in.');
  }
  return session;
}

export async function signUp(
  email: string,
  password: string,
  metadata?: Partial<AuthUserMetadata>
): Promise<AuthSession> {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: {
      data: metadata,
    },
  });
  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
  const session = toAuthSession(data.session);
  if (!session && data.user) {
    throw new Error('Check your email to confirm your account, then sign in.');
  }
  if (!session) {
    throw new Error('Sign-up completed, but no session was returned.');
  }
  return session;
}

export async function signOut(): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
}

export function onAuthStateChange(
  callback: AuthStateChangeCallback
): AuthSubscription {
  const client = requireClient();
  const { data } = client.auth.onAuthStateChange(
    (event: AuthChangeEvent, session: SupabaseSession | null) => {
      callback(
        toAuthSession(session),
        toUserProfile(session?.user ?? null),
        event as AuthStateChangeEvent
      );
    }
  );
  return {
    unsubscribe: () => data.subscription.unsubscribe(),
  };
}
