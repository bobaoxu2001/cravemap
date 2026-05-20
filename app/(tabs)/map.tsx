import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Restaurant } from '../../types';
import { getAllRestaurants } from '../../src/services/restaurants';
import RestaurantMap from '../../components/RestaurantMap';

const CITIES = ['All', 'New York City', 'Los Angeles', 'Bay Area', 'Seattle', 'Boston'];
const SORT_OPTIONS = ['Taste Match', 'Local Approved', 'Check-ins', 'Newest'];

const IS_WEB = Platform.OS === 'web';

/**
 * Minimalist list item — aligned with new RestaurantCard shape.
 * Dropped: TasteMatchBadge component, local% pill, open/closed dot+text,
 * 2 tag chips, recommendation reason. Single image + name + cuisine/price/
 * neighborhood + match%, with Closed (only) as a quiet inline note.
 */
function RestaurantListItem({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, ${restaurant.tasteMatchPercent}% taste match, ${restaurant.cuisine}, ${restaurant.price}, ${restaurant.neighborhood}${!restaurant.isOpen ? ', closed' : ''}`}
      accessibilityHint="Opens restaurant details"
    >
      <Image source={{ uri: restaurant.images[0] }} style={styles.listImage} />
      <View style={styles.listContent}>
        <Text style={styles.listName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.listSub} numberOfLines={1}>
          {restaurant.cuisine} · {restaurant.price} · {restaurant.neighborhood}
        </Text>
        <Text style={styles.previewMatch}>
          {restaurant.tasteMatchPercent}% match{!restaurant.isOpen ? ' · Closed' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Minimalist preview card — image + name + cuisine/price/neighborhood + match%.
 * Local-approved badge and tag chips dropped; CTA simplified to a hairline
 * tap target on the whole card. Aligned with the new RestaurantCard shape.
 */
function PreviewCard({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const router = useRouter();
  return (
    <View style={styles.previewCard}>
      <TouchableOpacity
        style={styles.previewClose}
        onPress={onClose}
        hitSlop={10}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Close preview"
      >
        <Ionicons name="close" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/restaurant/${restaurant.id}`)}
        style={styles.previewBody}
        accessibilityRole="button"
        accessibilityLabel={`${restaurant.name}, ${restaurant.tasteMatchPercent}% taste match`}
        accessibilityHint="Opens restaurant details"
      >
        <Image source={{ uri: restaurant.images[0] }} style={styles.previewImage} />
        <View style={styles.previewInfo}>
          <Text style={styles.previewName} numberOfLines={1}>{restaurant.name}</Text>
          <Text style={styles.previewSub} numberOfLines={1}>
            {restaurant.cuisine} · {restaurant.price} · {restaurant.neighborhood}
          </Text>
          <Text style={styles.previewMatch}>{restaurant.tasteMatchPercent}% match</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export default function MapScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>(IS_WEB ? 'list' : 'map');
  const [selectedCity, setSelectedCity] = useState('All');
  const [sortBy, setSortBy] = useState('Taste Match');
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getAllRestaurants().then(setAllRestaurants).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return allRestaurants
      .filter((r) => selectedCity === 'All' || r.city === selectedCity)
      .sort((a, b) => {
        if (sortBy === 'Taste Match') return b.tasteMatchPercent - a.tasteMatchPercent;
        if (sortBy === 'Local Approved') return b.localApprovedPercent - a.localApprovedPercent;
        if (sortBy === 'Check-ins') return b.verifiedCheckIns - a.verifiedCheckIns;
        return 0;
      });
  }, [allRestaurants, selectedCity, sortBy]);

  // Drop selection if the selected restaurant is no longer in the filtered set.
  useEffect(() => {
    if (selectedId && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => (selectedId ? filtered.find((r) => r.id === selectedId) ?? null : null),
    [filtered, selectedId]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">Explore</Text>
        <View style={styles.toggle} accessibilityRole="radiogroup">
          {(['list', 'map'] as const).map((mode) => {
            const disabled = IS_WEB && mode === 'map';
            const isActive = viewMode === mode;
            const label = mode === 'list' ? 'List' : 'Map';
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.toggleBtn,
                  isActive && styles.toggleBtnActive,
                  disabled && styles.toggleBtnDisabled,
                ]}
                onPress={() => !disabled && setViewMode(mode)}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityLabel={`${label} view`}
                accessibilityState={{ selected: isActive, disabled }}
              >
                <Ionicons
                  name={mode === 'list' ? 'list-outline' : 'map-outline'}
                  size={16}
                  color={isActive ? '#fff' : Colors.textSecondary}
                />
                <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* City filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {CITIES.map((c) => {
          const isSelected = selectedCity === c;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedCity(c)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${c}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort bar dropped — default sort by Taste Match is fine for browsing.
          If we need re-sort later, expose it as a single button, not 4 chips. */}

      {viewMode === 'list' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
          <Text style={styles.resultCount}>{filtered.length} restaurants</Text>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No spots in this city yet.</Text>
              <Text style={styles.emptySubtitle}>Pick a different city from the filter row above — we cover 5 cities in beta.</Text>
            </View>
          ) : (
            filtered.map((r) => <RestaurantListItem key={r.id} restaurant={r} />)
          )}
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          <RestaurantMap
            restaurants={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          {selected && (
            <View style={styles.previewWrap} pointerEvents="box-none">
              <PreviewCard restaurant={selected} onClose={() => setSelectedId(null)} />
            </View>
          )}
        </View>
      )}
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
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnDisabled: {
    opacity: 0.4,
  },
  toggleText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterBar: {
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  sortBar: {
    maxHeight: 40,
    marginBottom: Spacing.sm,
  },
  sortChip: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  sortChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sortChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  resultCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listImage: {
    width: 100,
    height: 120,
  },
  listContent: {
    flex: 1,
    padding: Spacing.sm,
  },
  listTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  listName: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.xs,
  },
  listPrice: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  listSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  listBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  localBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  localText: {
    ...Typography.caption,
    color: '#B8860B',
    fontWeight: '600',
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
  listTags: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  listReason: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  previewWrap: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  previewClose: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewBody: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  previewInfo: {
    flex: 1,
    paddingRight: Spacing.xl,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  previewName: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.xs,
  },
  previewPrice: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  previewSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  previewMatch: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  previewBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  previewTags: {
    flexDirection: 'row',
  },
  previewCta: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  previewCtaText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
});
