import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { UserProfile } from '../types';
import { getPetStats, getXPSources, PetStats } from '../src/services/petSystem';
import AnimatedMascot from './AnimatedMascot';
import Sparkles from './Sparkles';

interface PetCardProps {
  profile: UserProfile;
}

// Animated XP progress bar
function XPBar({ progress, color }: { progress: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(width, {
      toValue: progress,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progress, width]);

  return (
    <View style={xpBarStyles.track}>
      <Animated.View
        style={[
          xpBarStyles.fill,
          {
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const xpBarStyles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

// Pulsing glow ring behind mascot (level 3+)
function GlowRing({ color, active }: { color: string; active: boolean }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, opacity]);

  if (!active) return null;
  return <Animated.View style={[styles.glowRing, { backgroundColor: color, opacity }]} />;
}

function StatBox({ value, label, labelZh }: { value: string | number; label: string; labelZh: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{labelZh}</Text>
      <Text style={styles.statLabelEn}>{label}</Text>
    </View>
  );
}

function LevelBadge({ stats }: { stats: PetStats }) {
  return (
    <View style={[styles.levelBadge, { backgroundColor: stats.accentColor }]}>
      <Text style={styles.levelBadgeEmoji}>{stats.emoji}</Text>
      <Text style={styles.levelBadgeNum}>Lv.{stats.level}</Text>
    </View>
  );
}

export default function PetCard({ profile }: PetCardProps) {
  const router = useRouter();
  const stats = getPetStats(profile);
  const sources = getXPSources(profile);
  const earnedSources = sources.filter((s) => s.earned);
  const showGlow = stats.level >= 3;
  const showSparkles = stats.level >= 4;
  const doPulse = stats.level >= 5;

  const firstName = profile.name.split(' ')[0];
  const petName = `${firstName}'s Dango`;

  return (
    <View style={styles.card}>
      {/* Level header row */}
      <View style={styles.levelRow}>
        <View>
          <Text style={styles.petName}>{petName}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.levelTitle}>{stats.emoji} {stats.title}</Text>
            <Text style={styles.levelTitleZh}>{stats.titleZh}</Text>
          </View>
        </View>
        <LevelBadge stats={stats} />
      </View>

      {/* Mascot with effects */}
      <View style={styles.mascotArea}>
        <GlowRing color={stats.accentColor} active={showGlow} />
        {showSparkles && <Sparkles active emoji="✨" />}
        <AnimatedMascot
          persona={profile.persona ?? 'Authentic Explorer'}
          size={110}
          animate
          pulse={doPulse}
        />
      </View>

      {/* XP Bar */}
      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpCurrent}>{stats.totalXP} XP</Text>
          {stats.isMaxLevel ? (
            <Text style={styles.xpMax}>MAX LEVEL ⭐</Text>
          ) : (
            <Text style={styles.xpNext}>{stats.nextLevelXP} XP</Text>
          )}
        </View>
        <XPBar progress={stats.progressInLevel} color={stats.accentColor} />
        {!stats.isMaxLevel && (
          <Text style={styles.xpHint}>
            {stats.xpToNextLevel} XP to <Text style={{ fontWeight: '700' }}>{stats.nextLevel?.titleZh} {stats.nextLevel?.emoji}</Text>
          </Text>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatBox value={profile.checkInCount} label="check-ins" labelZh="打卡" />
        <View style={styles.statDivider} />
        <StatBox value={profile.savedCount} label="saved" labelZh="收藏" />
        <View style={styles.statDivider} />
        <StatBox
          value={profile.foundingScoutProgress.verifiedCheckIn ? '✓' : '—'}
          label="verified"
          labelZh="已认证"
        />
        <View style={styles.statDivider} />
        <StatBox
          value={earnedSources.length}
          label="milestones"
          labelZh="成就"
        />
      </View>

      {/* How to earn XP */}
      <View style={styles.earnSection}>
        <Text style={styles.earnTitle}>How to level up</Text>
        <View style={styles.earnGrid}>
          {[
            { icon: 'camera-outline', label: 'Check-in', xp: '+50 XP', done: profile.checkInCount > 0 },
            { icon: 'checkmark-circle-outline', label: 'Verify visit', xp: '+150 XP', done: profile.foundingScoutProgress.verifiedCheckIn },
            { icon: 'compass-outline', label: 'Taste Passport', xp: '+200 XP', done: profile.foundingScoutProgress.tastePassport },
            { icon: 'people-outline', label: 'Invite friends', xp: '+150 XP', done: profile.foundingScoutProgress.twoInvites },
          ].map((item) => (
            <View key={item.label} style={[styles.earnItem, item.done && styles.earnItemDone]}>
              <Ionicons
                name={item.icon as any}
                size={16}
                color={item.done ? Colors.green : Colors.textMuted}
              />
              <View style={styles.earnInfo}>
                <Text style={[styles.earnLabel, item.done && styles.earnLabelDone]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.earnXP, { color: item.done ? Colors.green : stats.accentColor }]}>
                  {item.done ? '✓ earned' : item.xp}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      {!stats.isMaxLevel && (
        <TouchableOpacity
          style={[styles.ctaBtn, { borderColor: stats.accentColor }]}
          onPress={() => router.push('/check-in')}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={16} color={stats.accentColor} />
          <Text style={[styles.ctaBtnText, { color: stats.accentColor }]}>
            Post a check-in → +50 XP
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  petName: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  levelTitleZh: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  levelBadge: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    alignItems: 'center',
  },
  levelBadgeEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  levelBadgeNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  mascotArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 130,
    marginVertical: Spacing.sm,
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  xpSection: {
    marginBottom: Spacing.md,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  xpCurrent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  xpNext: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  xpMax: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B9EFF',
  },
  xpHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmBackground,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  statLabelEn: {
    fontSize: 8,
    color: Colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  earnSection: {
    marginBottom: Spacing.md,
  },
  earnTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  earnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    width: '47%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  earnItemDone: {
    backgroundColor: '#F0FBF5',
    borderColor: Colors.green + '40',
  },
  earnInfo: {
    flex: 1,
  },
  earnLabel: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '600',
  },
  earnLabelDone: {
    color: Colors.textMuted,
  },
  earnXP: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    paddingVertical: Spacing.sm,
  },
  ctaBtnText: {
    ...Typography.label,
    fontWeight: '700',
  },
});
