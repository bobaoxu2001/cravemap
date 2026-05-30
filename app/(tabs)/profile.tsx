import React, { useState, useEffect, useCallback } from 'react';
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
import { getPetStats } from '../../src/services/petSystem';
import { createInvite, redeemInvite } from '../../src/services/invites';
import { deleteAccount } from '../../src/services/account';
import { getInviteShareUrl } from '../../src/lib/links';
import { useAuth } from '../../src/hooks/useAuth';
import TagChip from '../../components/TagChip';
import Mascot from '../../components/Mascot';
import PetCard from '../../components/PetCard';

const DEMO_USER_ID = 'u001';

type MenuAction = 'invite' | 'help' | null;

const menuItems: Array<{ icon: string; label: string; route: string | null; action: MenuAction }> = [
  { icon: 'compass-outline', label: 'Edit Taste Passport', route: '/onboarding/taste-passport', action: null },
  { icon: 'checkmark-circle-outline', label: 'My Check-ins', route: '/my-check-ins', action: null },
  { icon: 'people-outline', label: 'Invite Friends', route: null, action: 'invite' },
  { icon: 'settings-outline', label: 'Settings', route: '/settings', action: null },
  { icon: 'help-circle-outline', label: 'Help & Support', route: null, action: 'help' },
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

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, [loadProfile]));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
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
      // Share a web landing URL, not a raw cravemap:// link, so recipients
      // without the app land on a real page (deep link + store links + code).
      const inviteUrl = getInviteShareUrl(invite.code);
      try {
        await Share.share({
          message: `Join me on CraveMap — find restaurants real locals go to.\n\nUse my invite link: ${inviteUrl}\n\nOr enter code manually: ${invite.code}`,
          title: 'Join CraveMap',
          url: inviteUrl,
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
    if (item.action === 'help') {
      Alert.alert('Help & Support', 'For questions or feedback, email us at hello@cravemap.app or visit our community Discord.', [{ text: 'OK' }]);
      return;
    }
    if (item.route) {
      router.push({ pathname: item.route as '/(tabs)/profile' | '/my-check-ins' | '/onboarding/taste-passport' | '/settings' });
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/onboarding/taste-passport')}>
            <Ionicons name="create-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Colored hero banner */}
          <View style={styles.profileBanner}>
            <View style={styles.profileBannerPattern}>
              {['🍜', '🌶️', '🍣', '🥗', '🍕'].map((e, i) => (
                <Text key={i} style={[styles.bannerEmoji, { opacity: 0.18 + i * 0.04, transform: [{ rotate: `${-10 + i * 8}deg` }] }]}>{e}</Text>
              ))}
            </View>
          </View>
          {/* Avatar overlapping the banner */}
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.cityText}>{profile.city}</Text>
            </View>
            <View style={styles.personaBadge}>
              <Text style={styles.personaBadgeText}>{persona}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.stat} onPress={() => router.push('/my-check-ins')} activeOpacity={0.7}>
              <Text style={styles.statNum}>{profile.checkInCount}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.stat} onPress={() => router.push('/(tabs)/saved')} activeOpacity={0.7}>
              <Text style={styles.statNum}>{profile.savedCount}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, profile.foundingScoutProgress.verifiedCheckIn && { color: Colors.green }]}>
                {profile.foundingScoutProgress.verifiedCheckIn ? '✓' : '—'}
              </Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.stat} onPress={() => {}} activeOpacity={0.7}>
              <Text style={styles.statNum}>Lv.{getPetStats(profile).level}</Text>
              <Text style={styles.statLabel}>Pet Level</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pet upgrade card */}
        <View style={styles.petCardWrap}>
          <PetCard profile={profile} />
        </View>

        {/* Taste Passport */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛂 Taste Passport</Text>
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeText}>{passportStatus}</Text>
            </View>
          </View>
          <View style={styles.personaRow}>
            <Mascot persona={persona} size={48} />
            <Ionicons name="sparkles-outline" size={15} color={Colors.primary} />
            <Text style={styles.personaText}>{persona}</Text>
          </View>

          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Loves</Text>
            <View style={styles.tasteChips}>
              {profile.tastePreferences.map((t) => (
                <TagChip key={t} label={t} variant="primary" />
              ))}
            </View>
          </View>
          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Avoids</Text>
            <View style={styles.tasteChips}>
              {profile.dislikes.map((d) => (
                <TagChip key={d} label={d} variant="neutral" />
              ))}
            </View>
          </View>
          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Trusts</Text>
            <View style={styles.tasteChips}>
              {profile.trustSources.map((s) => (
                <TagChip key={s} label={s} variant="green" />
              ))}
            </View>
          </View>
          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Food Scenes</Text>
            <View style={styles.tasteChips}>
              {profile.foodScenes.map((s) => (
                <TagChip key={s} label={s} variant="yellow" />
              ))}
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Badges</Text>
          {profile.badges.map((badge) => (
            <View key={badge} style={styles.badgeItem}>
              <View style={styles.badgeIcon}>
                <Text style={styles.badgeEmoji}>
                  {badge.includes('Scout') ? '🏅' : '✅'}
                </Text>
              </View>
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
                <Text style={styles.menuLabel}>
                  {isInviteItem && inviting ? 'Creating invite...' : item.label}
                </Text>
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
            onPress={async () => {
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
            }}
            disabled={signingOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.primary} />
            <Text style={styles.signOutText}>{signingOut ? 'Signing out...' : 'Sign Out'}</Text>
          </TouchableOpacity>
        )}
        {signOutError ? <Text style={styles.signOutError}>{signOutError}</Text> : null}

        {/* Delete Account — Apple Guideline 5.1.1(v): in-app deletion required.
            Two-tap confirmation because this is irreversible. */}
        {isSupabaseMode && (
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={() => {
              Alert.alert(
                'Delete account?',
                'This permanently removes your profile, check-ins, saved spots, and rewards. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert(
                        'Really delete?',
                        'Last chance — your data will be removed immediately.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete permanently',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await deleteAccount();
                                await signOut().catch(() => {});
                                router.replace('/onboarding/welcome');
                              } catch (err) {
                                Alert.alert(
                                  'Delete failed',
                                  err instanceof Error ? err.message : 'Please try again.'
                                );
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
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            accessibilityHint="Permanently delete your CraveMap account and all data"
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        )}

        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => router.push('/privacy-policy')} accessibilityRole="link">
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>·</Text>
          <TouchableOpacity onPress={() => router.push('/terms')} accessibilityRole="link">
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
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  profileBanner: {
    width: '100%',
    height: 90,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  profileBannerPattern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
  },
  bannerEmoji: {
    fontSize: 36,
    color: '#fff',
  },
  avatarWrapper: {
    marginTop: -44,
    marginBottom: Spacing.sm,
    borderWidth: 4,
    borderColor: Colors.card,
    borderRadius: 46,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
    paddingBottom: Spacing.md,
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
  petCardWrap: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
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
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 18,
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
    flex: 1,
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
  deleteAccountButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  deleteAccountText: {
    ...Typography.label,
    color: Colors.error,
    fontWeight: '600',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  legalLink: {
    ...Typography.caption,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    ...Typography.caption,
    color: Colors.textMuted,
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
  personaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  personaBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
});
