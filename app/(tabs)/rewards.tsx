import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Animated,
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
import { getTastePersona } from '../../src/services/profile';
import { useAuth } from '../../src/hooks/useAuth';
import ProgressBar from '../../components/ProgressBar';
import AnimatedMascot from '../../components/AnimatedMascot';
import Sparkles from '../../components/Sparkles';
import { CheckInEntrance } from '../../components/CheckInAnimation';

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

// Pulsing radial halo behind the mascot when all Founding Scout tasks are
// complete. Soft warm tone (matches the mascot card background family).
// Minimalist pass: Glow is a no-op. The pulsing halo behind the all-tasks-done
// mascot was too decorative; achievement is now communicated via a single
// "All complete" copy line and the green check rows. Keep the function so the
// JSX call site below continues to render.
function Glow() {
  return null;
}

export default function Rewards() {
  const router = useRouter();
  const { session, isSupabaseMode, profile: authProfile } = useAuth();
  const persona = authProfile ? getTastePersona(authProfile) : 'Authentic Explorer';
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [progress, setProgress] = useState<FoundingScoutProgress | null>(null);
  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRewards = useCallback(() => {
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

  useFocusEffect(useCallback(() => {
    loadRewards();
  }, [loadRewards]));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>Loading your progress…</Text>
        </View>
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
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/onboarding/welcome')} activeOpacity={0.85}>
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
          </View>
          <Text style={styles.heroTitle}>Founding Food Scout</Text>
          {/* One-line explainer for first-time visitors: tells them this is
              a 4-task program, not just an empty marketing label. */}
          <Text style={styles.heroSub}>
            Complete 4 tasks to earn a permanent badge + Pro access.
          </Text>
        </View>

        {/* "Why this matters" founder-note dropped — pure marketing copy. */}

        {/* Progress Card — duplicate "% complete" badge dropped; bar conveys it */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{completedCount} of {progress.totalCount} unlocked</Text>
          <ProgressBar progress={progressPercent} height={8} />
          <Text style={styles.progressHint}>
            {completedCount === progress.totalCount
              ? 'You are a Founding Food Scout!'
              : `${progress.totalCount - completedCount} more task${progress.totalCount - completedCount === 1 ? '' : 's'} to unlock all rewards`}
          </Text>

          {/* Tasks */}
          <View style={styles.taskList}>
            {tasks.map((task, idx) => (
              <CheckInEntrance key={task.key} delay={idx * 70} highlight={task.done}>
                <View style={[styles.taskItem, task.done && styles.taskItemDone]}>
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
              </CheckInEntrance>
            ))}
          </View>
        </View>

        {/* Rewards Section — single mascot card. The 2 hardcoded "reward" rows
            (Founding Scout Badge + Early Pro Access) repeat what the hero
            already implies. Lottery copy condensed. Glow + sparkles already
            no-op from v2/v3. */}
        <View style={styles.rewardsSection}>
          <View style={styles.mascotCard}>
            <View style={styles.mascotContainer}>
              <AnimatedMascot persona={persona} size={120} animate />
            </View>
            <Text style={styles.mascotTitle}>Mascot Plush · 50 made</Text>
            <Text style={styles.mascotDesc}>
              Scouts who complete all tasks enter the lottery.
            </Text>
            <View style={[styles.lotteryBtn, completedCount < progress.totalCount && styles.lotteryBtnDisabled]}>
              <Text style={[styles.lotteryBtnText, completedCount < progress.totalCount && styles.lotteryBtnTextDisabled]}>
                {completedCount < progress.totalCount ? `${progress.totalCount - completedCount} more to enter` : 'Enter lottery'}
              </Text>
            </View>
          </View>
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
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={18} color={Colors.primary} />
            <Text style={styles.secondaryCtaText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Footer note dropped — closes-at-1000 timing is mentioned in the hero subtitle */}

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
  heroTitle: {
    ...Typography.h1,
    color: '#fff',
    marginBottom: 2,
  },
  heroSub: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.92)',
  },
  taskItemDone: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.green,
    paddingLeft: Spacing.sm,
  },
  mascotContainer: {
    width: 180,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFB347',
    top: '50%',
    left: '50%',
    marginLeft: -80,
    marginTop: -80,
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
  progressTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
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
