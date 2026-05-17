import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { UserProfile } from '../../types';
import { USE_SUPABASE } from '../services/config';
import {
  getCurrentUser,
  getSession,
  onAuthStateChange,
  signIn as serviceSignIn,
  signOut as serviceSignOut,
  signUp as serviceSignUp,
} from '../services/auth';
import { getProfileById } from '../services/profile';
import type { AuthSession, AuthUserMetadata } from '../services/types';

interface AuthContextValue {
  user: UserProfile | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isSupabaseMode: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    metadata?: Partial<AuthUserMetadata>
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    setProfileLoading(true);
    try {
      const nextProfile = await getProfileById(userId);
      setProfile(nextProfile);
      return nextProfile;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!session) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }
    return loadProfile(session.userId);
  }, [loadProfile, session]);

  const refreshAuthState = useCallback(async () => {
    const nextSession = await getSession();
    const nextUser = await getCurrentUser();
    setSession(nextSession);
    setUser(nextUser);
    if (nextSession) {
      await loadProfile(nextSession.userId);
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;
    refreshAuthState()
      .catch(() => {
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const subscription = onAuthStateChange((nextSession, nextUser) => {
      if (!mounted) {
        return;
      }
      setSession(nextSession);
      setUser(nextUser);
      setLoading(false);
      if (!nextSession) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      void loadProfile(nextSession.userId).catch(() => {
        if (mounted) {
          setProfile(null);
          setProfileLoading(false);
        }
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, refreshAuthState]);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextSession = await serviceSignIn(email, password);
    setSession(nextSession);
    const nextUser = await getCurrentUser();
    setUser(nextUser);
    await loadProfile(nextSession.userId);
  }, [loadProfile]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Partial<AuthUserMetadata>
    ) => {
      const nextSession = await serviceSignUp(email, password, metadata);
      setSession(nextSession);
      const nextUser = await getCurrentUser();
      setUser(nextUser);
      await loadProfile(nextSession.userId);
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    await serviceSignOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      profileLoading,
      isAuthenticated: Boolean(session),
      isProfileComplete: Boolean(profile?.tastePassportComplete),
      isSupabaseMode: USE_SUPABASE,
      refreshProfile,
      signIn,
      signUp,
      signOut,
    }),
    [loading, profile, profileLoading, refreshProfile, session, signIn, signOut, signUp, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
