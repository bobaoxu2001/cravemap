import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../src/hooks/useAuth';

/**
 * Minimalist welcome — brand wordmark + one-line headline + auth card.
 * Dropped from the previous version:
 *   - Background blob decorations
 *   - Kicker line + beta pill + chinese slogan + sub-headline
 *   - 3 feature cards with emoji icons
 *   - Diff chips (NOT YELP / NOT DIANPING / NOT TIKTOK HYPE)
 *   - Social proof line + shadowed primary button
 * Everything users need to act lives above the fold.
 */
export default function Welcome() {
  const router = useRouter();
  const {
    isAuthenticated,
    isProfileComplete,
    isSupabaseMode,
    loading,
    profileLoading,
    signIn,
    signUp,
  } = useAuth();
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (isSupabaseMode && isAuthenticated && !profileLoading) {
      router.replace(isProfileComplete ? '/(tabs)/home' : '/onboarding/taste-passport');
    }
  }, [isAuthenticated, isProfileComplete, isSupabaseMode, profileLoading, router]);

  const handleAuthSubmit = async () => {
    const trimmedEmail = email.trim();
    setError('');
    setNotice('');

    if (!trimmedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === 'sign-in') {
        await signIn(trimmedEmail, password);
        router.replace('/(tabs)/home');
      } else {
        await signUp(trimmedEmail, password, {
          name: name.trim() || trimmedEmail.split('@')[0],
        });
        router.replace('/onboarding/taste-passport');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      if (message.toLowerCase().includes('confirm')) {
        setNotice(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand — headline says WHAT; sub-line says WHY-different in one breath */}
        <View style={styles.heroSection}>
          <Text style={styles.chineseName}>好吃GO</Text>
          <Text style={styles.appName}>CraveMap</Text>
          <Text style={styles.headline}>
            Find restaurants real locals go to — picked by people with your taste.
          </Text>
          <Text style={styles.subHeadline}>
            Verified check-ins · No paid reviews · No tourist traps
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          {isSupabaseMode ? (
            <View style={styles.authCard}>
              <View style={styles.authToggle}>
                {(['sign-in', 'sign-up'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.authToggleBtn, authMode === mode && styles.authToggleBtnActive]}
                    onPress={() => {
                      setAuthMode(mode);
                      setError('');
                      setNotice('');
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.authToggleText, authMode === mode && styles.authToggleTextActive]}>
                      {mode === 'sign-in' ? 'Sign in' : 'Create account'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tiny first-time nudge under the toggle, so users in beta know
                  there's no Yelp-style social-graph signup. */}
              <Text style={styles.authHint}>
                {authMode === 'sign-up'
                  ? "We'll ask 6 quick taste questions next."
                  : 'First time? Tap "Create account" above.'}
              </Text>

              {authMode === 'sign-up' && (
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Name"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              )}
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                textContentType={authMode === 'sign-in' ? 'password' : 'newPassword'}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, (submitting || loading) && styles.primaryButtonDisabled]}
                onPress={handleAuthSubmit}
                activeOpacity={0.85}
                disabled={submitting || loading}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting
                    ? 'Please wait...'
                    : authMode === 'sign-in'
                      ? 'Sign in'
                      : 'Create account'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/onboarding/taste-passport')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Build my Taste Passport</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              if (isSupabaseMode) {
                setAuthMode('sign-up');
                setError('');
                setNotice('');
              } else {
                router.replace('/(tabs)/home');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              {isSupabaseMode ? 'Create an account' : 'Browse demo without signing in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  chineseName: {
    fontSize: 44,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 52,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 4,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  headline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  subHeadline: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    letterSpacing: 0.3,
  },
  ctaContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  authCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    padding: 3,
    marginBottom: Spacing.xs,
  },
  authToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  authToggleBtnActive: {
    backgroundColor: Colors.card,
  },
  authToggleText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  authToggleTextActive: {
    color: Colors.text,
  },
  authHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.text,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    lineHeight: 18,
  },
  noticeText: {
    ...Typography.caption,
    color: Colors.green,
    lineHeight: 18,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
