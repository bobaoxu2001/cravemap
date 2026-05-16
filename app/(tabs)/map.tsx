import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { mockRestaurants } from '../../data/mockRestaurants';
import { Restaurant } from '../../types';
import TasteMatchBadge from '../../components/TasteMatchBadge';
import TagChip from '../../components/TagChip';

const CITIES = ['All', 'New York City', 'Los Angeles', 'Bay Area', 'Seattle', 'Boston'];
const SORT_OPTIONS = ['Taste Match', 'Local Approved', 'Check-ins', 'Newest'];

function RestaurantListItem({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      activeOpacity={0.88}
    >
      <Image source={{ uri: restaurant.images[0] }} style={styles.listImage} />
      <View style={styles.listContent}>
        <View style={styles.listTopRow}>
          <Text style={styles.listName} numberOfLines={1}>{restaurant.name}</Text>
          <Text style={styles.listPrice}>{restaurant.price}</Text>
        </View>
        <Text style={styles.listSub}>{restaurant.neighborhood} · {restaurant.cuisine}</Text>
        <View style={styles.listBadgeRow}>
          <TasteMatchBadge percent={restaurant.tasteMatchPercent} showLabel />
          <View style={styles.localBadge}>
            <Text style={styles.localText}>{restaurant.localApprovedPercent}% local</Text>
          </View>
          <View style={[styles.openDot, { backgroundColor: restaurant.isOpen ? Colors.green : Colors.textMuted }]} />
          <Text style={[styles.openText, { color: restaurant.isOpen ? Colors.green : Colors.textMuted }]}>
            {restaurant.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
        <View style={styles.listTags}>
          {restaurant.tags.slice(0, 2).map((t) => (
            <TagChip key={t} label={t} variant="neutral" size="sm" />
          ))}
        </View>
        <Text style={styles.listReason} numberOfLines={2}>{restaurant.recommendationReason}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MapScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCity, setSelectedCity] = useState('All');
  const [sortBy, setSortBy] = useState('Taste Match');

  const filtered = mockRestaurants
    .filter((r) => selectedCity === 'All' || r.city === selectedCity)
    .sort((a, b) => {
      if (sortBy === 'Taste Match') return b.tasteMatchPercent - a.tasteMatchPercent;
      if (sortBy === 'Local Approved') return b.localApprovedPercent - a.localApprovedPercent;
      if (sortBy === 'Check-ins') return b.verifiedCheckIns - a.verifiedCheckIns;
      return 0;
    });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.toggle}>
          {(['list', 'map'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
              onPress={() => setViewMode(mode)}
            >
              <Ionicons
                name={mode === 'list' ? 'list-outline' : 'map-outline'}
                size={16}
                color={viewMode === mode ? '#fff' : Colors.textSecondary}
              />
              <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
                {mode === 'list' ? 'List' : 'Map'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* City filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, selectedCity === c && styles.filterChipActive]}
            onPress={() => setSelectedCity(c)}
          >
            <Text style={[styles.filterChipText, selectedCity === c && styles.filterChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort options */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortBar} contentContainerStyle={styles.filterContent}>
        {SORT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortChipText, sortBy === s && styles.sortChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {viewMode === 'list' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
          <Text style={styles.resultCount}>{filtered.length} restaurants</Text>
          {filtered.map((r) => (
            <RestaurantListItem key={r.id} restaurant={r} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapMockBg}>
            <Text style={styles.mapGrid}>{'—  —  —  —  —  —\n|  .  .  .  .  .  |\n—  —  —  —  —  —\n|  .  .  .  .  .  |\n—  —  —  —  —  —'}</Text>
          </View>
          {/* Pin cards */}
          <View style={styles.mapPinCard}>
            <Text style={styles.mapPin}>📍</Text>
            <View style={styles.mapPinInfo}>
              <Text style={styles.mapPinName}>Xi'an Famous Foods</Text>
              <Text style={styles.mapPinSub}>Flushing · 94% match</Text>
            </View>
          </View>
          <View style={[styles.mapPinCard, { top: '35%', left: '40%' }]}>
            <Text style={styles.mapPin}>📍</Text>
            <View style={styles.mapPinInfo}>
              <Text style={styles.mapPinName}>Spicy Village</Text>
              <Text style={styles.mapPinSub}>Chinatown · 91% match</Text>
            </View>
          </View>
          <View style={styles.mapOverlay}>
            <Ionicons name="map" size={40} color={Colors.primary} />
            <Text style={styles.mapOverlayTitle}>Interactive Map</Text>
            <Text style={styles.mapOverlayText}>Native maps integration coming soon.</Text>
            <Text style={styles.mapOverlayText}>Use List view to explore {filtered.length} restaurants.</Text>
            <TouchableOpacity style={styles.switchToListBtn} onPress={() => setViewMode('list')}>
              <Text style={styles.switchToListText}>Switch to List View</Text>
            </TouchableOpacity>
          </View>
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
  mapPlaceholder: {
    flex: 1,
    position: 'relative',
  },
  mapMockBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGrid: {
    fontFamily: 'monospace',
    fontSize: 24,
    color: '#C8D8C8',
    lineHeight: 40,
    textAlign: 'center',
  },
  mapPinCard: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    maxWidth: 180,
  },
  mapPin: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  mapPinInfo: {
    flex: 1,
  },
  mapPinName: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
  },
  mapPinSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  mapOverlayTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  mapOverlayText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  switchToListBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  switchToListText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
});
