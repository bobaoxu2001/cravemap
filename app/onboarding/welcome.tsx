import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

const features = [
  {
    icon: '🏘️',
    title: 'Local Picks',
    desc: 'Curated by people who actually live there, not tourists.',
  },
  {
    icon: '👤',
    title: 'Taste Match',
    desc: 'Find restaurants loved by people with your exact taste.',
  },
  {
    icon: '✅',
    title: 'Real Check-ins',
    desc: 'Location-verified reviews — no bots, no paid influencers.',
  },
];

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Decorative background blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Header */}
        <View style={styles.heroSection}>
          <Text style={styles.kicker}>FOOD DISCOVERY · 5 CITIES · INVITE-ONLY</Text>
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
            <Text style={styles.sloganChinese}>本地人带路，同口味避雷</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
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
              <Text style={styles.diffChipText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/onboarding/taste-passport')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Build My Taste Passport →</Text>
          </TouchableOpacity>
          <Text style={styles.socialProof}>
            847 Founding Food Scouts already in. 153 spots left.
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign in</Text>
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
  emojiDecor: {
    fontSize: 28,
    marginBottom: Spacing.md,
    letterSpacing: 8,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
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
    ...Typography.h1,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
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
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  diffChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  socialProof: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  chineseName: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 60,
  },
  appName: {
    fontSize: 22,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginBottom: Spacing.md,
  },
  sloganContainer: {
    alignItems: 'center',
  },
  slogan: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sloganChinese: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 28,
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
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  foodEmoji: {
    fontSize: 28,
  },
  ctaContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    ...Typography.h3,
    color: '#fff',
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
