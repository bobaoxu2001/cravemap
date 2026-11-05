// ============================================================================
// useStudioAuthGate — redirects unauthenticated users away from Studio screens
// ============================================================================
// Studio post-landing screens (/studio/onboarding, /dashboard, /analysis,
// /campaign) all require an authenticated Supabase session. This hook
// performs the redirect once auth state has settled, passing the current
// path as `next` so the welcome screen can route back here after sign-in.
//
// The Studio landing (/studio) does NOT use this hook — it's public marketing.
// ============================================================================

import { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from './useAuth';

export type StudioGateState =
  | { ready: true; blocked: false }
  | { ready: false; blocked: false } // still loading auth
  | { ready: false; blocked: true; reason: 'mock-mode' | 'unauthenticated' };

/**
 * Call at the top of a Studio screen that requires auth.
 * - In Supabase mode + unauthenticated: redirects to welcome with ?next=<path>.
 * - In mock mode: returns `blocked: 'mock-mode'`. The caller should render a
 *   "Studio requires Supabase" placeholder rather than its normal content.
 * - While auth is still loading: returns `ready: false, blocked: false`.
 *   The caller should render a spinner.
 */
export function useStudioAuthGate(): StudioGateState {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isAuthenticated, isSupabaseMode } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isSupabaseMode) return; // surfaced as `blocked: mock-mode`
    if (isAuthenticated) return;
    router.replace({
      pathname: '/onboarding/welcome',
      params: { next: pathname },
    });
  }, [loading, isAuthenticated, isSupabaseMode, pathname, router]);

  if (loading) {
    return { ready: false, blocked: false };
  }
  if (!isSupabaseMode) {
    return { ready: false, blocked: true, reason: 'mock-mode' };
  }
  if (!isAuthenticated) {
    return { ready: false, blocked: true, reason: 'unauthenticated' };
  }
  return { ready: true, blocked: false };
}
