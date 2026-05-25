import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const features = [
  {
    icon: '🧠',
    title: 'AI Menu Analysis',
    desc: 'Paste your menu and get positioning insights instantly.',
  },
  {
    icon: '📣',
    title: 'Campaign Generator',
    desc: 'Turn dishes into ready-to-post Instagram captions and SMS blasts.',
  },
  {
    icon: '📈',
    title: 'Review Intelligence',
    desc: 'Upload reviews to surface what customers love (and what to fix).',
  },
  {
    icon: '🤖',
    title: 'Agent Logs',
    desc: 'See exactly what the AI did and why, every step of the way.',
  },
];

export default function StudioHome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoPill}>
            <Text style={styles.logoEmoji}>📊</Text>
            <Text style={styles.logoLabel}>CraveMap Studio</Text>
          </View>
          <Text style={styles.headline}>Your restaurant,{'\n'}amplified by AI.</Text>
          <Text style={styles.subline}>
            Upload your menu and reviews. CraveMap Studio turns them into marketing
            campaigns and customer insights — in seconds.
          </Text>
        </View>

        {/* Feature previews */}
        <View style={styles.featureList}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureEmoji}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureName}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Coming soon CTA */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaBadge}>
            <View style={styles.ctaBadgeDot} />
            <Text style={styles.ctaBadgeText}>EARLY ACCESS</Text>
          </View>
          <Text style={styles.ctaTitle}>Be first in the door.</Text>
          <Text style={styles.ctaDesc}>
            CraveMap Studio is launching to a small group of restaurants first.
            Join the waitlist and we'll reach out personally.
          </Text>
          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
            <Text style={styles.ctaButtonText}>Join the Waitlist</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0E0E2A',
  },
  blob1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3A3AFF18',
  },
  blob2: {
    position: 'absolute',
    bottom: 80,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary + '14',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  backText: {
    ...Typography.label,
    color: '#A0A0C8',
  },
  header: {
    marginBottom: Spacing.xl,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E1E40',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#3A3AFF40',
  },
  logoEmoji: {
    fontSize: 16,
  },
  logoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8888FF',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  subline: {
    ...Typography.body,
    color: '#A0A0C8',
    lineHeight: 23,
  },
  featureList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: '#1E1E40',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#3A3AFF20',
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#14142E',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    ...Typography.caption,
    color: '#A0A0C8',
    lineHeight: 18,
  },
  ctaCard: {
    backgroundColor: '#1A1A3E',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#3A3AFF50',
    ...Shadows.md,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  ctaBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7B7BFF',
  },
  ctaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#7B7BFF',
  },
  ctaTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  ctaDesc: {
    ...Typography.body,
    color: '#A0A0C8',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    backgroundColor: '#3A3AFF',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#3A3AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonText: {
    ...Typography.h3,
    color: '#fff',
  },
});
