import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Restaurant } from '../../types';
import { getSavedRestaurants, unsaveRestaurant } from '../../src/services/saved';
import { useAuth } from '../../src/hooks/useAuth';

const DEMO_USER_ID = 'u001';

export default function Saved() {
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const onRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    setLoadError('');
    getSavedRestaurants(userId)
      .then(setSavedRestaurants)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load saved restaurants.'))
      .finally(() => setRefreshing(false));
  }, [userId]);

  const loadSaved = useCallback(() => {
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

  useFocusEffect(useCallback(() => {
    loadSaved();
  }, [loadSaved]));

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
          <Text style={styles.headerTitle} accessibilityRole="header">Saved</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔐</Text>
          <Text style={styles.emptyTitle}>Sign in to save restaurants.</Text>
          <Text style={styles.emptyDesc}>Your saved spots will sync across devices when you have an account.</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.replace('/onboarding/welcome')}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
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
          <Text style={styles.headerTitle} accessibilityRole="header">Saved</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Could not load your saved restaurants.</Text>
          <Text style={styles.emptyDesc}>{loadError}</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={loadSaved}
            accessibilityRole="button"
            accessibilityLabel="Retry loading saved restaurants"
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
          <Text style={styles.headerTitle} accessibilityRole="header">Saved</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔖</Text>
          <Text style={styles.emptyTitle}>Nothing saved yet. Start collecting your hit list.</Text>
          <Text style={styles.emptyDesc}>Tap the bookmark on any spot that catches your eye — your future self will thank you.</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)/home')}
            accessibilityRole="button"
            accessibilityLabel="Explore restaurants"
            accessibilityHint="Goes to the Home tab to browse restaurants"
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
        <Text style={styles.headerTitle} accessibilityRole="header">Saved</Text>
        <Text style={styles.headerCount}>{savedRestaurants.length} restaurants</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Minimalist saved cards — aligned with RestaurantCard + map list
            item. Dropped: TasteMatchBadge component, open/closed dot, wait
            time row, recommendation reason. The bookmark on the right
            removes from the list (clear inverse of saving). */}
        {savedRestaurants.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            onPress={() => router.push(`/restaurant/${r.id}`)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${r.name}, ${r.tasteMatchPercent}% taste match, ${r.cuisine}, ${r.price}, ${r.neighborhood}${!r.isOpen ? ', closed' : ''}`}
            accessibilityHint="Opens restaurant details"
          >
            <Image source={{ uri: r.images[0] }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {r.cuisine} · {r.price} · {r.neighborhood}
              </Text>
              <Text style={styles.cardMatch}>
                {r.tasteMatchPercent}% match{!r.isOpen ? ' · Closed' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleUnsave(r.id)}
              hitSlop={10}
              style={styles.unsaveBtn}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${r.name} from saved`}
            >
              <Ionicons name="bookmark" size={20} color={Colors.primary} />
            </TouchableOpacity>
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
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    width: 96,
    height: 96,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  cardMatch: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  unsaveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cardSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
