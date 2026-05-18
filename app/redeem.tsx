import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { redeemInvite } from '../src/services/invites';
import { useAuth } from '../src/hooks/useAuth';
import Sparkles from '../components/Sparkles';

const DEMO_USER_ID = 'u001';

type RedeemState = 'loading' | 'success' | 'error' | 'no-code' | 'not-signed-in';

export default function RedeemScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();

  const [state, setState] = useState<RedeemState>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fade-in animation for result card
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  function animateIn() {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
  }

  useEffect(() => {
    let cancelled = false;

    async function attempt() {
      // Guard: no code in params
      if (!code || !code.trim()) {
        setState('no-code');
        animateIn();
        return;
      }

      // Guard: not signed in (Supabase mode only)
      if (isSupabaseMode && !session) {
        setState('not-signed-in');
        animateIn();
        return;
      }

      const userId = isSupabaseMode ? (session?.userId ?? '') : DEMO_USER_ID;

      setState('loading');
      const result = await redeemInvite(userId, code);

      if (cancelled) return;

      if (result.success) {
        setState('success');
      } else {
        setState('error');
        setErrorMsg(result.error ?? 'Could not redeem invite. Please try again.');
      }
      animateIn();
    }

    attempt();
    return () => { cancelled = true; };
    // Run once on mount — intentionally omit deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGoToProfile() {
    // Navigate to the profile tab
    router.replace('/(tabs)/profile' as any);
  }

  function handleGoBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile' as any);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redeem Invite</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.container}>
        {state === 'loading' ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Redeeming your invite…</Text>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.card,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {state === 'success' && (
              <>
                <View style={styles.mascotBox}>
                  <Sparkles active />
                  <Text style={styles.bigEmoji}>🎉</Text>
                </View>
                <Text style={styles.title}>Welcome to CraveMap!</Text>
                <Text style={styles.subtitle}>
                  Your invite code <Text style={styles.code}>{String(code).toUpperCase()}</Text> has been redeemed.
                  {'\n'}You're officially part of the community.
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleGoToProfile}>
                  <Text style={styles.primaryBtnText}>Go to My Profile</Text>
                </TouchableOpacity>
              </>
            )}

            {state === 'error' && (
              <>
                <Text style={styles.bigEmoji}>😕</Text>
                <Text style={styles.title}>Couldn't Redeem Code</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoBack}>
                  <Text style={styles.secondaryBtnText}>Go Back</Text>
                </TouchableOpacity>
              </>
            )}

            {state === 'no-code' && (
              <>
                <Text style={styles.bigEmoji}>🔍</Text>
                <Text style={styles.title}>No Code Found</Text>
                <Text style={styles.subtitle}>
                  This link doesn't include an invite code. Ask your friend to share their invite link again.
                </Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoBack}>
                  <Text style={styles.secondaryBtnText}>Go Back</Text>
                </TouchableOpacity>
              </>
            )}

            {state === 'not-signed-in' && (
              <>
                <Text style={styles.bigEmoji}>🔐</Text>
                <Text style={styles.title}>Sign In First</Text>
                <Text style={styles.subtitle}>
                  You need to be signed in to redeem an invite code.
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleGoBack}>
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  center: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mascotBox: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  bigEmoji: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  code: {
    color: Colors.primary,
    fontWeight: '700',
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    ...Typography.h3,
  },
  secondaryBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.text,
    ...Typography.h3,
  },
});
