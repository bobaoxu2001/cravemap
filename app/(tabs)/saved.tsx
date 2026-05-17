import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Restaurant } from '../../types';
import { getSavedRestaurants, unsaveRestaurant } from '../../src/services/saved';
import { useAuth } from '../../src/hooks/useAuth';
import TasteMatchBadge from '../../components/TasteMatchBadge';

const DEMO_USER_ID = 'u001';

export default function Saved() {
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    getSavedRestaurants(userId)
      .then(setSavedRestaurants)
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Could not load saved restaurants.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleUnsave = async (id: string) => {
    if (!userId) return;
    await unsaveRestaurant(userId, id);
    setSavedRestaurants((prev) => prev.filter((r) => r.id !== id));
  };

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔐</Text>
          <Text style={styles.emptyTitle}>Sign in to save restaurants.</Text>
          <Text style={styles.emptyDesc}>Your saved spots will sync across devices when you have an account.</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.replace('/onboarding/welcome')}
          >
            <Text style={styles.exploreBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Could not load your saved restaurants.</Text>
          <Text style={styles.emptyDesc}>{loadError}</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => {
              if (!userId) return;
              setLoading(true);
              setLoadError('');
              getSavedRestaurants(userId)
                .then(setSavedRestaurants)
                .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load saved restaurants.'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.exploreBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (savedRestaurants.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔖</Text>
          <Text style={styles.emptyTitle}>Nothing saved yet. Start collecting your hit list.</Text>
          <Text style={styles.emptyDesc}>Tap the bookmark on any spot that catches your eye — your future self will thank you.</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.exploreBtnText}>Explore Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.headerCount}>{savedRestaurants.length} restaurants</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {savedRestaurants.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            onPress={() => router.push(`/restaurant/${r.id}`)}
            activeOpacity={0.88}
          >
            <Image source={{ uri: r.images[0] }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
                <TouchableOpacity onPress={() => handleUnsave(r.id)} hitSlop={10}>
                  <Ionicons name="bookmark" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSub}>{r.neighborhood} · {r.cuisine}</Text>
              <View style={styles.cardBadgeRow}>
                <TasteMatchBadge percent={r.tasteMatchPercent} showLabel />
                <Text style={styles.cardPrice}>{r.price}</Text>
              </View>
              <View style={styles.cardStatusRow}>
                <View style={[styles.openDot, { backgroundColor: r.isOpen ? Colors.green : Colors.textMuted }]} />
                <Text style={[styles.openText, { color: r.isOpen ? Colors.green : Colors.textMuted }]}>
                  {r.isOpen ? 'Open now' : 'Closed'}
                </Text>
                {r.waitTime && (
                  <>
                    <Text style={styles.dotSep}>·</Text>
                    <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.waitText}>{r.waitTime} wait</Text>
                  </>
                )}
              </View>
              <Text style={styles.cardReason} numberOfLines={2}>{r.recommendationReason}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  headerCount: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 56,
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
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  exploreBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: 110,
    height: 130,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  cardName: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardPrice: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  dotSep: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  waitText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  cardReason: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
