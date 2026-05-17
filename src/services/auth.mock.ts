import type { UserProfile } from '../../types';
import { mockUser } from '../../data/mockUser';
import type { AuthSession, SignInInput, SignUpInput } from './types';

const FAKE_EMAIL = 'demo@cravemap.app';

export function getCurrentSession(): Promise<AuthSession | null> {
  return Promise.resolve({ userId: mockUser.id, email: FAKE_EMAIL });
}

export function getCurrentUser(): Promise<UserProfile | null> {
  return Promise.resolve(mockUser);
}

export function signIn(_input: SignInInput): Promise<AuthSession> {
  return Promise.resolve({ userId: mockUser.id, email: FAKE_EMAIL });
}

export function signUp(_input: SignUpInput): Promise<AuthSession> {
  return Promise.resolve({ userId: mockUser.id, email: FAKE_EMAIL });
}

export function signOut(): Promise<void> {
  return Promise.resolve();
}
