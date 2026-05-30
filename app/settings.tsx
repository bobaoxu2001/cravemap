import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { createInvite } from '../src/services/invites';
import { getInviteShareUrl } from '../src/lib/links';
import { useAuth } from '../src/hooks/useAuth';

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showChevron = false,
  danger = false,
  rightElement,
  isLast = false,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon as any} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {rightElement ?? null}
      {showChevron && !rightElement ? (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function Settings() {
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();
  const userId = isSupabaseMode ? (session?.userId ?? null) : 'u001';

  const [pushEnabled, setPushEnabled] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(false);
  const [friendActivity, setFriendActivity] = useState(true);
  const [newSpotsCity, setNewSpotsCity] = useState(true);
  const [showDietaryFlags, setShowDietaryFlags] = useState(true);
  const [inviting, setInviting] = useState(false);

  const handleInviteFriends = async () => {
    if (isSupabaseMode && !userId) {
      Alert.alert('Sign in required', 'Create an account to invite friends.');
      return;
    }
    setInviting(true);
    try {
      const invite = await createInvite();
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

  const handleSavedLists = () => {
    Alert.alert('Coming Soon', 'Manage Saved Lists is coming in a future update.', [{ text: 'OK' }]);
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Full bilingual support coming soon', [{ text: 'OK' }]);
  };

  const handleRate = () => {
    Linking.openURL('https://apps.apple.com').catch(() => {
      Alert.alert('Could not open App Store', 'Please search for CraveMap manually.', [{ text: 'OK' }]);
    });
  };

  const handleShare = () => {
    Share.share({
      message: 'Check out CraveMap — the local food discovery app built by real food scouts. https://cravemap.app',
      title: 'CraveMap',
    }).catch(() => {});
  };

  const handlePrivacy = () => {
    router.push('/privacy-policy');
  };

  const handleTerms = () => {
    router.push('/terms');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Account */}
        <SettingsSection title="ACCOUNT">
          <SettingsRow
            icon="compass-outline"
            label="Edit Taste Profile"
            onPress={() => router.push('/onboarding/taste-passport')}
            showChevron
          />
          <SettingsRow
            icon="people-outline"
            label={inviting ? 'Creating invite…' : 'Invite Friends'}
            onPress={() => { void handleInviteFriends(); }}
            showChevron
          />
          <SettingsRow
            icon="bookmark-outline"
            label="Manage Saved Lists"
            onPress={handleSavedLists}
            showChevron
            isLast
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="NOTIFICATIONS">
          <SettingsRow
            icon="notifications-outline"
            label="Push notifications"
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow
            icon="alarm-outline"
            label="Check-in reminders"
            rightElement={
              <Switch
                value={checkInReminders}
                onValueChange={setCheckInReminders}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow
            icon="person-add-outline"
            label="Friend activity"
            rightElement={
              <Switch
                value={friendActivity}
                onValueChange={setFriendActivity}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow
            icon="location-outline"
            label="New spots in my city"
            rightElement={
              <Switch
                value={newSpotsCity}
                onValueChange={setNewSpotsCity}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            }
            isLast
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="PREFERENCES">
          <SettingsRow
            icon="flag-outline"
            label="Show dietary flags on cards"
            rightElement={
              <Switch
                value={showDietaryFlags}
                onValueChange={setShowDietaryFlags}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow
            icon="language-outline"
            label="Language"
            value="English / 中文"
            onPress={handleLanguage}
            showChevron
            isLast
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="ABOUT">
          <SettingsRow
            icon="star-outline"
            label="Rate CraveMap ⭐"
            onPress={handleRate}
            showChevron
          />
          <SettingsRow
            icon="share-outline"
            label="Share CraveMap"
            onPress={handleShare}
            showChevron
          />
          <SettingsRow
            icon="shield-outline"
            label="Privacy Policy"
            onPress={handlePrivacy}
            showChevron
          />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={handleTerms}
            showChevron
          />
          <SettingsRow
            icon="information-circle-outline"
            label="Version"
            value="v1.0.0-beta.1"
            isLast
          />
        </SettingsSection>

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
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  sectionBlock: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  rowLabelDanger: {
    color: Colors.error,
  },
  rowValue: {
    ...Typography.label,
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
