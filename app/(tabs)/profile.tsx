import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { UserProfile } from '../../types';
import { getCurrentProfile, getTastePersona } from '../../src/services/profile';
import { createInvite, redeemInvite } from '../../src/services/invites';
import { deleteAccount } from '../../src/services/account';
import { useAuth } from '../../src/hooks/useAuth';
import TagChip from '../../components/TagChip';
import Mascot from '../../components/Mascot';

const DEMO_USER_ID = 'u001';

type MenuAction = 'invite' | null;

// Sub-labels explain WHAT each row does — a one-line "why click this".
// Especially important for "Founding Scout" (not obviously a reward program)
// and "Invite Friends" (users may not know it's tied to scout progress).
const menuItems: Array<{ icon: string; label: string; sub?: string; route: string | null; action: MenuAction }> = [
  { icon: 'compass-outline',         label: 'Edit Taste Passport', sub: 'Update what you like, avoid, and trust', route: '/onboarding/taste-passport', action: null },
  { icon: 'checkmark-circle-outline', label: 'My Check-ins',        sub: 'Posts you have shared',                  route: '/my-check-ins',              action: null },
  { icon: 'star-outline',             label: 'Founding Scout',      sub: 'Early-member rewards · 4 tasks',         route: '/(tabs)/rewards',            action: null },
  { icon: 'people-outline',           label: 'Invite Friends',      sub: 'Share an invite code · counts toward Scout', route: null,                     action: 'invite' },
  { icon: 'settings-outline',         label: 'Settings',           sub: 'Coming after launch',                       route: null,                         action: null },
  { icon: 'help-circle-outline',      label: 'Help & Support',     sub: 'Email beta team for bugs / requests',      route: null,                         action: null },
];

export default function Profile() {
  const router = useRouter();
  const { session, isSupabaseMode, profile: authProfile, signOut } = useAuth();
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  const loadProfile = useCallback(() => {
    let mounted = true;
    setLoading(true);
    getCurrentProfile()
      .then((nextProfile) => {
        if (mounted) {
          setProfile(nextProfile ?? authProfile);
          setLoadError('');
        }
      })
      .catch((err) => {
        if (mounted) {
          setProfile(authProfile);
          setLoadError(err instanceof Error ? err.message : 'Could not load profile.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [authProfile]);

  // `useFocusEffect` fires on initial focus AND every subsequent screen focus,
  // so a separate mount-time `useEffect` would just double-fetch on first
  // render. Single hook is enough.
  useFocusEffect(useCallback(() => {
    loadProfile();
  }, [loadProfile]));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>Loading your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyProfile}>
          <Text style={styles.emptyTitle}>Profile not ready yet</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={() => router.replace('/onboarding/taste-passport')}>
            <Text style={styles.signOutText}>Finish Taste Passport</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleInvite = async () => {
    if (isSupabaseMode && !userId) {
      Alert.alert('Sign in required', 'Create an account to invite friends.');
      return;
    }
    setInviting(true);
    try {
      const invite = await createInvite();
      try {
        await Share.share({
          message: `Join me on CraveMap — the local food discovery app!\n\nUse my invite link: cravemap://redeem?code=${invite.code}\n\nOr enter code manually: ${invite.code}`,
          title: 'Join CraveMap',
          url: `cravemap://redeem?code=${invite.code}`,
        });
      } catch {
        Alert.alert('Your invite code', invite.code, [{ text: 'OK' }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create invite. Please try again.';
      Alert.alert('Invite error', message);
    } finally {
      setInviting(false);
    }
  };

  const handleMenuPress = (item: typeof menuItems[number]) => {
    if (item.action === 'invite') {
      void handleInvite();
      return;
    }
    if (item.route) {
      router.push({ pathname: item.route as '/(tabs)/profile' | '/my-check-ins' | '/onboarding/taste-passport' });
      return;
    }
    // No route + no action = unwired stub. Surface a friendly notice so the
    // tap isn't silently swallowed (worst UX = "did anything happen?").
    if (item.label === 'Settings') {
      Alert.alert('Settings', 'Not in beta yet — coming after launch. For now, your taste passport is editable above.');
    } else if (item.label === 'Help & Support') {
      Alert.alert('Help & Support', 'Beta support: email ax2183@nyu.edu with bugs, ideas, or restaurant requests.');
    }
  };

  const handleRedeem = async () => {
    const trimmed = redeemCode.trim().toUpperCase();
    if (!trimmed) return;
    if (isSupabaseMode && !userId) {
      Alert.alert('Sign in required', 'Create an account to redeem an invite code.');
      return;
    }
    setRedeeming(true);
    setRedeemError('');
    setRedeemSuccess(false);
    try {
      const result = await redeemInvite(userId ?? DEMO_USER_ID, trimmed);
      if (result.success) {
        setRedeemSuccess(true);
        setRedeemCode('');
      } else {
        setRedeemError(result.error ?? 'Could not redeem code. Please try again.');
      }
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Could not redeem code. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  const persona = profile.persona ?? getTastePersona(profile);
  const passportStatus = profile.tastePassportComplete ? 'Complete ✅' : 'Incomplete';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header — edit pencil dropped (no handler wired) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.cityText}>{profile.city}</Text>
            </View>
          </View>
          {/* "Verified" was opaque — relabelled to "Verified visit" so users
              know it means "you have at least one location-confirmed check-in". */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.checkInCount}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.savedCount}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, profile.foundingScoutProgress.verifiedCheckIn && { color: Colors.green }]}>
                {profile.foundingScoutProgress.verifiedCheckIn ? '✓' : '—'}
              </Text>
              <Text style={styles.statLabel}>Verified visit</Text>
            </View>
          </View>
        </View>

        {/* Taste Passport — emoji-led headers and decorative sparkles dropped */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Taste Passport</Text>
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeText}>{passportStatus}</Text>
            </View>
          </View>
          <View style={styles.personaRow}>
            <Mascot persona={persona} size={48} />
            <Text style={styles.personaText}>{persona}</Text>
          </View>

          {/* Single "Loves" chip row only — Avoids/Trusts/Food Scenes
              were 3 extra sections of chip noise. Users can re-enter via
              "Edit Taste Passport" if they want to review the rest. */}
          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Loves</Text>
            <View style={styles.tasteChips}>
              {profile.tastePreferences.map((t) => (
                <TagChip key={t} label={t} variant="neutral" />
              ))}
            </View>
          </View>
        </View>

        {/* Badges — emoji header dropped; redundant per-badge icon box dropped */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {profile.badges.map((badge) => (
            <View key={badge} style={styles.badgeItem}>
              <Ionicons name="ribbon-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.badgeLabel}>{badge}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.section}>
          {menuItems.map((item) => {
            const isInviteItem = item.action === 'invite';
            const isDisabled = isInviteItem && inviting;
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>
                    {isInviteItem && inviting ? 'Creating invite...' : item.label}
                  </Text>
                  {item.sub && !(isInviteItem && inviting) && (
                    <Text style={styles.menuSub}>{item.sub}</Text>
                  )}
                </View>
                {isInviteItem && inviting ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Redeem invite code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎟️ Have an invite code?</Text>
          <View style={styles.redeemRow}>
            <TextInput
              style={styles.redeemInput}
              value={redeemCode}
              onChangeText={(t) => {
                setRedeemCode(t.toUpperCase());
                setRedeemError('');
                setRedeemSuccess(false);
              }}
              placeholder="CRAVE-XXXXXX"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              editable={!redeeming}
            />
            <TouchableOpacity
              style={[
                styles.redeemBtn,
                (redeeming || redeemCode.trim().length < 6) && styles.redeemBtnDisabled,
              ]}
              onPress={() => { void handleRedeem(); }}
              disabled={redeeming || redeemCode.trim().length < 6}
              activeOpacity={0.85}
            >
              {redeeming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.redeemBtnText}>Redeem</Text>
              )}
            </TouchableOpacity>
          </View>
          {redeemSuccess && (
            <Text style={styles.redeemSuccess}>
              🎉 Code redeemed! You've helped a friend reach their Scout goal.
            </Text>
          )}
          {!!redeemError && <Text style={styles.redeemError}>{redeemError}</Text>}
        </View>

        {loadError ? <Text style={styles.signOutError}>{loadError}</Text> : null}

        {isSupabaseMode && (
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => {
              // Confirm before signing out — easy to fat-finger at the bottom
              // of the scroll, and re-signing in is friction (especially on
              // TestFlight where testers may not remember their password).
              Alert.alert(
                'Sign out?',
                'You will need to sign back in to view your check-ins, invites, and saved spots.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign out',
                    style: 'destructive',
                    onPress: async () => {
                      setSigningOut(true);
                      setSignOutError('');
                      try {
                        await signOut();
                        router.replace('/onboarding/welcome');
                      } catch (err) {
                        setSignOutError(
                          err instanceof Error ? err.message : 'Could not sign out. Please try again.'
                        );
                      } finally {
                        setSigningOut(false);
                      }
                    },
                  },
                ]
              );
            }}
            disabled={signingOut}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            accessibilityHint="Shows a confirmation, then ends your session"
            accessibilityState={{ disabled: signingOut }}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.primary} />
            <Text style={styles.signOutText}>{signingOut ? 'Signing out...' : 'Sign Out'}</Text>
          </TouchableOpacity>
        )}
        {signOutError ? <Text style={styles.signOutError}>{signOutError}</Text> : null}

        {/* Delete Account — destructive, two-confirmation flow */}
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={() => {
            Alert.alert(
              'Delete account?',
              'This permanently deletes your profile, all check-ins, saved restaurants, and invite history. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete my account',
                  style: 'destructive',
                  onPress: () => {
                    // Second confirmation — Apple requires it to be intentional
                    Alert.alert(
                      'Are you absolutely sure?',
                      'All your data will be permanently deleted and cannot be recovered.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Yes, delete everything',
                          style: 'destructive',
                          onPress: async () => {
                            setDeletingAccount(true);
                            try {
                              await deleteAccount();
                              await signOut();
                              router.replace('/onboarding/welcome');
                            } catch (err) {
                              Alert.alert(
                                'Could not delete account',
                                err instanceof Error
                                  ? err.message
                                  : 'Please try again or contact ax2183@nyu.edu.'
                              );
                            } finally {
                              setDeletingAccount(false);
                            }
                          },
                        },
                      ]
                    );
                  },
                },
              ]
            );
          }}
          disabled={deletingAccount}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          accessibilityHint="Shows a confirmation before permanently deleting your account and all data"
          accessibilityState={{ disabled: deletingAccount }}
        >
          {deletingAccount ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          )}
        </TouchableOpacity>

        {/* Legal links — required for App Store compliance */}
        <View style={styles.legalRow}>
          <TouchableOpacity
            onPress={() => router.push('/privacy-policy')}
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy"
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity
            onPress={() => router.push('/terms')}
            accessibilityRole="link"
            accessibilityLabel="Terms of Service"
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  profileCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.sm,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cityText: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    ...Typography.h2,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  section: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  completeBadge: {
    backgroundColor: '#E8F5EE',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  completeBadgeText: {
    ...Typography.caption,
    color: Colors.green,
    fontWeight: '600',
  },
  tasteSection: {
    marginBottom: Spacing.sm,
  },
  tasteLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tasteChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  badgeLabel: {
    ...Typography.label,
    color: Colors.text,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  menuSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomPad: {
    height: Spacing.xl,
  },
  signOutButton: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  signOutText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
  },
  signOutError: {
    ...Typography.caption,
    color: Colors.error,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  personaText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyProfile: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  redeemRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  redeemInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.label,
    color: Colors.text,
    backgroundColor: Colors.background,
    letterSpacing: 1,
  },
  redeemBtn: {
    height: 44,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  redeemBtnDisabled: {
    backgroundColor: Colors.border,
  },
  redeemBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
  redeemSuccess: {
    ...Typography.caption,
    color: Colors.green,
    fontWeight: '600',
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  redeemError: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  deleteAccountButton: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  deleteAccountText: {
    ...Typography.label,
    color: Colors.error,
    fontWeight: '600',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  legalLink: {
    ...Typography.caption,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalDot: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
