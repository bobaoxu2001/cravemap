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
import type { AuthSession, AuthUserMetadata } from '../services/types';

interface AuthContextValue {
  user: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSupabaseMode: boolean;
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuthState = useCallback(async () => {
    const [nextSession, nextUser] = await Promise.all([
      getSession(),
      getCurrentUser(),
    ]);
    setSession(nextSession);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let mounted = true;
    refreshAuthState()
      .catch(() => {
        if (mounted) {
          setSession(null);
          setUser(null);
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
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshAuthState]);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextSession = await serviceSignIn(email, password);
    setSession(nextSession);
    const nextUser = await getCurrentUser();
    setUser(nextUser);
  }, []);

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
    },
    []
  );

  const signOut = useCallback(async () => {
    await serviceSignOut();
    setSession(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(session),
      isSupabaseMode: USE_SUPABASE,
      signIn,
      signUp,
      signOut,
    }),
    [loading, session, signIn, signOut, signUp, user]
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
