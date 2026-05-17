import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/restaurant/${restaurant.id}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.92}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.images[0] }} style={styles.image} />

        {/* Taste match circular badge - top left */}
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgePercent}>{restaurant.tasteMatchPercent}%</Text>
          <Text style={styles.matchBadgeLabel}>match</Text>
        </View>

        <View style={styles.imageOverlay}>
          <View style={[styles.openBadge, { backgroundColor: restaurant.isOpen ? Colors.green : Colors.textMuted }]}>
            <Text style={styles.openText}>{restaurant.isOpen ? 'Open' : 'Closed'}</Text>
          </View>
          {restaurant.waitTime && (
            <View style={styles.waitBadge}>
              <Ionicons name="time-outline" size={10} color={Colors.textSecondary} />
              <Text style={styles.waitText}>{restaurant.waitTime}</Text>
            </View>
          )}
        </View>

        {/* Cuisine band at bottom of image */}
        <View style={styles.cuisineBand}>
          <Text style={styles.cuisineText} numberOfLines={1}>{restaurant.cuisine}</Text>
          {restaurant.tags[0] && (
            <View style={styles.imageTagChip}>
              <Text style={styles.imageTagText} numberOfLines={1}>{restaurant.tags[0]}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.sub} numberOfLines={1}>{restaurant.neighborhood} · {restaurant.price}</Text>

        <View style={styles.trustRow}>
          <Text style={styles.trustText} numberOfLines={1}>
            🏘️ {restaurant.localApprovedPercent}% local · ✅ {restaurant.verifiedCheckIns.toLocaleString()} visits
          </Text>
        </View>

        <View style={styles.reasonPill}>
          <Text style={styles.reason} numberOfLines={2}>💡 {restaurant.recommendationReason}</Text>
        </View>

        {(() => {
          const signal = restaurant.trendingSignal;
          if (signal === 'trending') {
            return <Text style={[styles.socialSignal, { color: '#E8450A' }]}>🔥 Trending</Text>;
          }
          if (signal === 'rising') {
            return <Text style={[styles.socialSignal, { color: '#FF8A00' }]}>📈 Rising</Text>;
          }
          if (signal === 'underrated') {
            return <Text style={[styles.socialSignal, { color: Colors.green }]}>💎 Underrated</Text>;
          }
          if (signal === 'classic') {
            return <Text style={[styles.socialSignal, { color: '#B8860B' }]}>⭐ Classic</Text>;
          }
          if (restaurant.friendsSaved && restaurant.friendsSaved > 0) {
            return <Text style={[styles.socialSignal, { color: Colors.textMuted }]}>👥 {restaurant.friendsSaved} saved this</Text>;
          }
          return null;
        })()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  matchBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  matchBadgePercent: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.green,
    lineHeight: 14,
  },
  matchBadgeLabel: {
    fontSize: 8,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cuisineBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: Spacing.xs,
  },
  cuisineText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  imageTagChip: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 110,
  },
  imageTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  openBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  openText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  waitText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  sub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  trustRow: {
    marginBottom: Spacing.xs,
  },
  trustText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  reasonPill: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  reason: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 17,
  },
  socialSignal: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
