import type { UserProfile } from '../../types';
import { mockUser } from '../../data/mockUser';
import type {
  AuthSession,
  AuthStateChangeCallback,
  AuthSubscription,
  AuthUserMetadata,
} from './types';

const FAKE_EMAIL = 'demo@cravemap.app';

const mockSession: AuthSession = {
  userId: mockUser.id,
  email: FAKE_EMAIL,
  emailConfirmed: true,
};

export function getSession(): Promise<AuthSession | null> {
  return Promise.resolve(mockSession);
}

export function getCurrentSession(): Promise<AuthSession | null> {
  return Promise.resolve({ userId: mockUser.id, email: FAKE_EMAIL });
}

export function getCurrentUser(): Promise<UserProfile | null> {
  return Promise.resolve(mockUser);
}

export function signIn(_email: string, _password: string): Promise<AuthSession> {
  return Promise.resolve(mockSession);
}

export function signUp(
  _email: string,
  _password: string,
  _metadata?: Partial<AuthUserMetadata>
): Promise<AuthSession> {
  return Promise.resolve(mockSession);
}

export function signOut(): Promise<void> {
  return Promise.resolve();
}

export function onAuthStateChange(
  callback: AuthStateChangeCallback
): AuthSubscription {
  callback(mockSession, mockUser, 'INITIAL_SESSION');
  return { unsubscribe: () => undefined };
}
