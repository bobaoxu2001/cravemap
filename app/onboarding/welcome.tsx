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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../src/hooks/useAuth';

const features = [
  {
    icon: '🏘️',
    iconBg: '#E8F5EE',
    title: 'Local Picks',
    desc: 'Curated by people who actually live there, not tourists.',
    accentColor: Colors.green,
  },
  {
    icon: '👤',
    iconBg: Colors.secondary,
    title: 'Taste Match',
    desc: 'Find restaurants loved by people with your exact taste.',
    accentColor: Colors.primary,
  },
  {
    icon: '✅',
    iconBg: '#F0F4FF',
    title: 'Real Check-ins',
    desc: 'Location-verified reviews — no bots, no paid influencers.',
    accentColor: '#7B9EFF',
  },
  {
    icon: '🐾',
    iconBg: '#FFF3E0',
    title: 'Your Food Pet',
    desc: 'Level up your Dango the more you eat and explore.',
    accentColor: Colors.accent,
  },
];

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
        {/* Decorative background blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Header */}
        <View style={styles.heroSection}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDot} />
            <Text style={styles.kicker}>FOOD DISCOVERY · 5 CITIES · INVITE-ONLY</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.chineseName}>好吃GO</Text>
            <View style={styles.betaPill}>
              <Text style={styles.betaPillText}>BETA</Text>
            </View>
          </View>
          <Text style={styles.appName}>CraveMap</Text>
          <View style={styles.sloganContainer}>
            <Text style={styles.headline}>Stop eating at tourist traps.</Text>
            <Text style={styles.headlineSub}>
              Find restaurants real locals actually go to — picked by people with your exact taste.
            </Text>
            <View style={styles.sloganChineseWrap}>
              <Text style={styles.sloganChinese}>本地人带路，同口味避雷</Text>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((f, i) => (
            <View key={i} style={[styles.featureCard, { borderLeftColor: f.accentColor }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: f.iconBg }]}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Differentiation chips */}
        <View style={styles.diffRow}>
          {['NOT YELP', 'NOT DIANPING', 'NOT TIKTOK HYPE'].map((c) => (
            <View key={c} style={styles.diffChip}>
              <Ionicons name="close" size={10} color={Colors.textSecondary} />
              <Text style={styles.diffChipText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
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
                      ? 'Sign In'
                      : 'Create Account'}
                </Text>
                {!submitting && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/onboarding/taste-passport')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Build My Taste Passport</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Social proof */}
          <View style={styles.socialProofRow}>
            <View style={styles.socialProofDots}>
              {['🔴', '🟠', '🟡'].map((dot, i) => (
                <Text key={i} style={styles.socialProofDot}>{dot}</Text>
              ))}
            </View>
            <Text style={styles.socialProof}>
              847 Founding Food Scouts already in. <Text style={{ color: Colors.primary, fontWeight: '700' }}>153 spots left.</Text>
            </Text>
          </View>

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
              {isSupabaseMode ? 'Create account to build your Taste Passport' : 'Browse demo without signing in →'}
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
    backgroundColor: Colors.secondary,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  blob1: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary + '18',
  },
  blob2: {
    position: 'absolute',
    bottom: 120,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.accent + '20',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  betaPill: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  betaPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  headlineSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  diffRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  diffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  diffChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.textSecondary,
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  socialProofDots: {
    flexDirection: 'row',
  },
  socialProofDot: {
    fontSize: 8,
    marginRight: -2,
  },
  socialProof: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  chineseName: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 60,
  },
  appName: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  sloganContainer: {
    alignItems: 'center',
  },
  sloganChineseWrap: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sloganChinese: {
    ...Typography.label,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  featuresContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  ctaContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    ...Typography.h3,
    color: '#fff',
  },
  authCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    padding: 3,
    marginBottom: Spacing.xs,
  },
  authToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
  },
  authToggleBtnActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  authToggleText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  authToggleTextActive: {
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
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
