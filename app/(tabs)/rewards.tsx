import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { mockUser } from '../../data/mockUser';
import ProgressBar from '../../components/ProgressBar';

const tasks = [
  {
    key: 'tastePassport' as const,
    label: 'Complete Taste Passport',
    doneLabel: 'Done!',
    pendingLabel: 'Complete your taste profile',
    points: 50,
  },
  {
    key: 'threeCheckIns' as const,
    label: 'Post 3 real check-ins',
    doneLabel: '3/3 posted',
    pendingLabel: '1/3 posted',
    points: 150,
  },
  {
    key: 'verifiedCheckIn' as const,
    label: 'Get 1 location-verified check-in',
    doneLabel: 'Verified!',
    pendingLabel: 'Not yet',
    points: 100,
  },
  {
    key: 'twoInvites' as const,
    label: 'Invite 2 friends',
    doneLabel: '2/2 invited',
    pendingLabel: '0/2 invited',
    points: 100,
  },
];

const rewards = [
  {
    emoji: '🏅',
    title: 'Founding Food Scout Badge',
    desc: 'Permanent "Founding Food Scout" badge on your profile. Only the first 1,000 scouts earn this.',
    color: '#FFF8E1',
    borderColor: Colors.accent,
  },
  {
    emoji: '⭐',
    title: 'Early Pro Access',
    desc: 'Get 6 months of CraveMap Pro free — AI taste matching, exclusive restaurant drops, and priority support.',
    color: '#F0F4FF',
    borderColor: '#7B9EFF',
  },
  {
    emoji: '🧸',
    title: 'Mascot Plush Lottery',
    desc: 'Enter the lottery for a limited-edition 好吃GO dango mascot plush. Only 50 made. 🍡',
    color: '#FFF0F5',
    borderColor: '#FFB3CC',
  },
];

const completedCount = Object.values(mockUser.foundingScoutProgress).filter(Boolean).length;
const progress = completedCount / tasks.length;

export default function Rewards() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏅 Founding Food Scout</Text>
          <Text style={styles.headerSub}>Be part of something real. Join our first 1,000 Food Scouts.</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{completedCount}/{tasks.length} done</Text>
            </View>
          </View>
          <ProgressBar progress={progress} height={8} />
          <Text style={styles.progressHint}>
            {completedCount === tasks.length
              ? '🎉 You are a Founding Food Scout!'
              : `${tasks.length - completedCount} more task${tasks.length - completedCount === 1 ? '' : 's'} to unlock all rewards`}
          </Text>

          {/* Tasks */}
          <View style={styles.taskList}>
            {tasks.map((task) => {
              const done = mockUser.foundingScoutProgress[task.key];
              return (
                <View key={task.key} style={styles.taskItem}>
                  <View style={[styles.taskCheckbox, done && styles.taskCheckboxDone]}>
                    {done ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <View style={styles.taskCheckboxEmpty} />
                    )}
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskLabel, done && styles.taskLabelDone]}>{task.label}</Text>
                    <Text style={[styles.taskStatus, done && styles.taskStatusDone]}>
                      {done ? task.doneLabel : task.pendingLabel}
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{task.points}pts</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <Text style={styles.rewardsSectionTitle}>🎁 Your Rewards</Text>
          {rewards.map((r) => (
            <View key={r.title} style={[styles.rewardCard, { backgroundColor: r.color, borderColor: r.borderColor }]}>
              <Text style={styles.rewardEmoji}>{r.emoji}</Text>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{r.title}</Text>
                <Text style={styles.rewardDesc}>{r.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => router.push('/check-in')}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.primaryCtaText}>Post a Check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryCta}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={18} color={Colors.primary} />
            <Text style={styles.secondaryCtaText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            🕐 Founding Scout status closes when we hit 1,000 members or launch publicly — whichever comes first.
          </Text>
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerSub: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  progressCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  progressBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  progressBadgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  progressHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxDone: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  taskCheckboxEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  taskInfo: {
    flex: 1,
  },
  taskLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  taskLabelDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskStatus: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  taskStatusDone: {
    color: Colors.green,
    fontWeight: '600',
  },
  pointsBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  pointsText: {
    ...Typography.caption,
    color: '#B8860B',
    fontWeight: '700',
  },
  rewardsSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  rewardsSectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rewardEmoji: {
    fontSize: 32,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  rewardDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  ctaSection: {
    marginHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  primaryCta: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryCtaText: {
    ...Typography.h3,
    color: '#fff',
  },
  secondaryCta: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  secondaryCtaText: {
    ...Typography.h3,
    color: Colors.primary,
  },
  footerNote: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  footerNoteText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
