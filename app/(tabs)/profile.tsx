import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { mockUser } from '../../data/mockUser';
import TagChip from '../../components/TagChip';

const menuItems = [
  { icon: 'compass-outline', label: 'Edit Taste Passport', route: '/onboarding/taste-passport' },
  { icon: 'checkmark-circle-outline', label: 'My Check-ins', route: null },
  { icon: 'settings-outline', label: 'Settings', route: null },
  { icon: 'help-circle-outline', label: 'Help & Support', route: null },
];

export default function Profile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: mockUser.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{mockUser.name}</Text>
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.cityText}>{mockUser.city}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{mockUser.checkInCount}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{mockUser.savedCount}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{mockUser.badges.length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        {/* Taste Passport */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛂 Taste Passport</Text>
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeText}>Complete ✅</Text>
            </View>
          </View>

          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Loves</Text>
            <View style={styles.tasteChips}>
              {mockUser.tastePreferences.map((t) => (
                <TagChip key={t} label={t} variant="primary" />
              ))}
            </View>
          </View>
          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Avoids</Text>
            <View style={styles.tasteChips}>
              {mockUser.dislikes.map((d) => (
                <TagChip key={d} label={d} variant="neutral" />
              ))}
            </View>
          </View>
          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Trusts</Text>
            <View style={styles.tasteChips}>
              {mockUser.trustSources.map((s) => (
                <TagChip key={s} label={s} variant="green" />
              ))}
            </View>
          </View>
          <View style={styles.tasteSection}>
            <Text style={styles.tasteLabel}>Food Scenes</Text>
            <View style={styles.tasteChips}>
              {mockUser.foodScenes.map((s) => (
                <TagChip key={s} label={s} variant="yellow" />
              ))}
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Badges</Text>
          {mockUser.badges.map((badge) => (
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
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
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
});
