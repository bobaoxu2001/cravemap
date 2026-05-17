import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { FoundingScoutProgress, RewardTask } from '../../src/services/types';
import { getFoundingScoutProgress, getRewardTasks } from '../../src/services/rewards';
import { useAuth } from '../../src/hooks/useAuth';
import ProgressBar from '../../components/ProgressBar';

const DEMO_USER_ID = 'u001';

const TASK_LABELS: Record<RewardTask['key'], { done: string; pending: string }> = {
  tastePassport: { done: 'Done!', pending: 'Complete your taste profile' },
  threeCheckIns: { done: '3/3 posted', pending: '1/3 posted' },
  verifiedCheckIn: { done: 'Verified!', pending: 'Not yet' },
  twoInvites: { done: '2/2 invited', pending: '0/2 invited' },
};

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
];

export default function Rewards() {
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [progress, setProgress] = useState<FoundingScoutProgress | null>(null);
  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSupabaseMode && !userId) {
      setLoading(false);
      return;
    }
    const id = userId ?? DEMO_USER_ID;
    setLoading(true);
    setError('');
    Promise.all([getFoundingScoutProgress(id), getRewardTasks(id)])
      .then(([p, t]) => { setProgress(p); setTasks(t); })
      .catch(() => setError('Could not load your progress. Please try again.'))
      .finally(() => setLoading(false));
  }, [userId, isSupabaseMode]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (isSupabaseMode && !userId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Sign in to track your progress</Text>
          <Text style={styles.emptySubtitle}>
            Your Founding Scout rewards are tied to your account.
          </Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth/sign-in')} activeOpacity={0.85}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !progress) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Couldn't load rewards</Text>
          <Text style={styles.emptySubtitle}>{error || 'Something went wrong.'}</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => {
              const id = userId ?? DEMO_USER_ID;
              setLoading(true);
              setError('');
              Promise.all([getFoundingScoutProgress(id), getRewardTasks(id)])
                .then(([p, t]) => { setProgress(p); setTasks(t); })
                .catch(() => setError('Could not load your progress. Please try again.'))
                .finally(() => setLoading(false));
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const completedCount = progress.completedCount;
  const progressPercent = progress.percentComplete;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero header card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroBadgeEmoji}>🏅</Text>
            <View style={styles.spotsRemainingPill}>
              <Text style={styles.spotsRemainingText}>153 spots remaining</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Founding Food Scout</Text>
          <Text style={styles.heroSub}>Only 1,000 spots. 847 claimed.</Text>
        </View>

        {/* Why this matters */}
        <View style={styles.whyCard}>
          <Text style={styles.whyTitle}>Why this matters</Text>
          <Text style={styles.whyText}>
            Hey — I built CraveMap because every food app started feeling the same: same 10 viral spots, same staged photos, same lukewarm "must-try" lists. The first 1,000 scouts get to flip that. Your check-ins literally train the model. Your picks become the local-approved feed. You\'re not a user — you\'re a co-author. Thanks for being early.
          </Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{completedCount} of {progress.totalCount} unlocked</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{Math.round(progressPercent * 100)}% complete</Text>
            </View>
          </View>
          <ProgressBar progress={progressPercent} height={12} />
          <Text style={styles.progressHint}>
            {completedCount === progress.totalCount
              ? '🎉 You are a Founding Food Scout!'
              : `${progress.totalCount - completedCount} more task${progress.totalCount - completedCount === 1 ? '' : 's'} to unlock all rewards`}
          </Text>

          {/* Tasks */}
          <View style={styles.taskList}>
            {tasks.map((task) => (
              <View key={task.key} style={[styles.taskItem, task.done && styles.taskItemDone]}>
                <View style={[styles.taskCheckbox, task.done && styles.taskCheckboxDone]}>
                  {task.done ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <View style={styles.taskCheckboxEmpty} />
                  )}
                </View>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskLabel, task.done && styles.taskLabelDone]}>{task.label}</Text>
                  <Text style={[styles.taskStatus, task.done && styles.taskStatusDone]}>
                    {task.done ? TASK_LABELS[task.key].done : TASK_LABELS[task.key].pending}
                  </Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>+{task.points}pts</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <Text style={styles.rewardsSectionTitle}>🎁 Your Rewards</Text>

          {/* Mascot hero reward */}
          <View style={styles.mascotCard}>
            <Text style={styles.mascotEmoji}>🍡</Text>
            <Text style={styles.mascotTitle}>The 好吃GO Dango Mascot Plush</Text>
            <Text style={styles.mascotDesc}>
              Limited edition. Only 50 plushies will exist. Founding Food Scouts get lottery entry — no purchase needed.
            </Text>
            <View style={[styles.lotteryBtn, completedCount < progress.totalCount && styles.lotteryBtnDisabled]}>
              <Text style={[styles.lotteryBtnText, completedCount < progress.totalCount && styles.lotteryBtnTextDisabled]}>
                {completedCount < progress.totalCount ? `Complete ${progress.totalCount - completedCount} more task${progress.totalCount - completedCount === 1 ? '' : 's'} to enter` : 'Enter Lottery'}
              </Text>
            </View>
          </View>

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
  heroCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroBadgeEmoji: {
    fontSize: 36,
  },
  spotsRemainingPill: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  spotsRemainingText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  heroTitle: {
    ...Typography.h1,
    color: '#fff',
    marginBottom: 2,
  },
  heroSub: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.92)',
  },
  whyCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  whyTitle: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  whyText: {
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 18,
  },
  taskItemDone: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.green,
    paddingLeft: Spacing.sm,
  },
  mascotCard: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FFB3CC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mascotEmoji: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  mascotTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  mascotDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  lotteryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  lotteryBtnDisabled: {
    backgroundColor: Colors.border,
  },
  lotteryBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
  lotteryBtnTextDisabled: {
    color: Colors.textMuted,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  signInBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
});
