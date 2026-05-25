import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

export default function RoleSelect() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={styles.container}>
        {/* Brand lockup */}
        <View style={styles.brand}>
          <Text style={styles.brandName}>好吃GO</Text>
          <Text style={styles.appName}>CraveMap</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>What brings you to{'\n'}CraveMap today?</Text>

        {/* Choice cards */}
        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, styles.dinerCard]}
            onPress={() => router.push('/onboarding/welcome')}
            activeOpacity={0.88}
          >
            <View style={[styles.cardIcon, { backgroundColor: Colors.secondary }]}>
              <Text style={styles.cardEmoji}>🍜</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>I'm hungry</Text>
              <Text style={styles.cardSubtitle}>
                Find restaurants and dishes that match your cravings.
              </Text>
            </View>
            <View style={[styles.cardArrow, { backgroundColor: Colors.primary }]}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.studioCard]}
            onPress={() => router.push('/studio')}
            activeOpacity={0.88}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#EFF1FF' }]}>
              <Text style={styles.cardEmoji}>📊</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, styles.studioCardTitle]}>I run a restaurant</Text>
              <Text style={[styles.cardSubtitle, styles.studioCardSubtitle]}>
                Use AI to turn your menu into campaigns and customer insights.
              </Text>
            </View>
            <View style={[styles.cardArrow, { backgroundColor: '#3A3AFF' }]}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer note */}
        <Text style={styles.footer}>
          You can switch anytime from your account settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  blob1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primary + '12',
  },
  blob2: {
    position: 'absolute',
    bottom: 100,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#3A3AFF12',
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandName: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 50,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 4,
    marginTop: 2,
  },
  title: {
    ...Typography.h1,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.3,
    marginBottom: Spacing.xl + Spacing.md,
  },
  cards: {
    gap: Spacing.md,
    flex: 1,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.md,
  },
  dinerCard: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  studioCard: {
    backgroundColor: '#18183A',
    borderWidth: 1.5,
    borderColor: '#3A3AFF40',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  studioCardTitle: {
    color: '#FFFFFF',
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  studioCardSubtitle: {
    color: '#A0A0C8',
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  footer: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
