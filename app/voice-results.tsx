import React, { useEffect, useState } from 'react';
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
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { Restaurant } from '../types';
import { VoiceIntent } from '../src/services/voice';
import { getVoiceState, clearVoiceState } from '../src/services/voiceState';
import RestaurantCard from '../components/RestaurantCard';

export default function VoiceResults() {
  const router = useRouter();
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [results, setResults] = useState<Restaurant[]>([]);

  useEffect(() => {
    const { intent: i, results: r } = getVoiceState();
    setIntent(i);
    setResults(r);
    return () => { clearVoiceState(); };
  }, []);

  const hasFilters =
    (intent?.cuisineFilters.length ?? 0) > 0 ||
    (intent?.tagFilters.length ?? 0) > 0 ||
    (intent?.categoryFilters.length ?? 0) > 0 ||
    intent?.priceFilter != null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Voice Search</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Intent card */}
        <View style={styles.intentCard}>
          <View style={styles.intentIconRow}>
            <View style={styles.micBadge}>
              <Ionicons name="mic" size={16} color="#fff" />
            </View>
            <Text style={styles.intentLabel}>You asked for</Text>
          </View>

          {intent?.transcript ? (
            <Text style={styles.transcript}>"{intent.transcript}"</Text>
          ) : null}

          <View style={styles.interpretRow}>
            <View style={styles.interpretPill}>
              <Text style={styles.interpretText}>
                🎯 {intent?.displayText ?? 'restaurants nearby'}
              </Text>
            </View>
          </View>

          {/* Filter chips */}
          {hasFilters && (
            <View style={styles.filterChips}>
              {intent?.cuisineFilters.map((c) => (
                <View key={c} style={[styles.filterChip, styles.chipCuisine]}>
                  <Text style={styles.filterChipText}>{c}</Text>
                </View>
              ))}
              {intent?.tagFilters.map((t) => (
                <View key={t} style={[styles.filterChip, styles.chipTag]}>
                  <Text style={styles.filterChipText}>{t}</Text>
                </View>
              ))}
              {intent?.categoryFilters.map((c) => (
                <View key={c} style={[styles.filterChip, styles.chipCat]}>
                  <Text style={styles.filterChipText}>{c.replace(/-/g, ' ')}</Text>
                </View>
              ))}
              {intent?.priceFilter && (
                <View style={[styles.filterChip, styles.chipPrice]}>
                  <Text style={styles.filterChipText}>{intent.priceFilter}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {results.length > 0
              ? `${results.length} restaurant${results.length === 1 ? '' : 's'} found`
              : 'No matches found'}
          </Text>
          {results.length > 0 && (
            <Text style={styles.resultsSub}>Sorted by taste match</Text>
          )}
        </View>

        {results.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {results.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No matches for that combination</Text>
            <Text style={styles.emptyDesc}>
              Try a broader search — e.g., just "辣的" or just "Chinese"
            </Text>
          </View>
        )}

        {/* Try again */}
        <TouchableOpacity
          style={styles.tryAgainBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="mic-outline" size={18} color={Colors.primary} />
          <Text style={styles.tryAgainText}>Search again by voice</Text>
        </TouchableOpacity>

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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  intentCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  intentIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  micBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  transcript: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  interpretRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  interpretPill: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  interpretText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  filterChip: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  chipCuisine: { backgroundColor: '#E8F5EE' },
  chipTag: { backgroundColor: '#FFF4E6' },
  chipCat: { backgroundColor: '#F0F4FF' },
  chipPrice: { backgroundColor: '#FFF8E1' },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  resultsHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  resultsCount: {
    ...Typography.h3,
    color: Colors.text,
  },
  resultsSub: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  cardsRow: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tryAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
  },
  tryAgainText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
