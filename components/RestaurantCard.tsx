import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Restaurant } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

/**
 * Minimalist card — three pieces of info only: photo, name, sub-line.
 * Closed state and a single match badge are the only overlays.
 * Trending signal, reason pill, trust row, and cuisine band were dropped
 * to lower visual density — they live on the Restaurant Detail screen.
 *
 * Wrapped in React.memo because this is rendered in horizontal lists on
 * the Home tab — parent re-renders (city change, refresh, profile load)
 * would otherwise re-render every card even when their props are stable.
 */
function RestaurantCardInner({ restaurant }: RestaurantCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/restaurant/${restaurant.id}`);
  };

  // Build a single descriptive label so screen readers announce each card
  // as a coherent unit instead of reading the photo + percent + sub-line
  // independently.
  const a11yLabel = [
    restaurant.name,
    `${restaurant.tasteMatchPercent}% taste match`,
    `${restaurant.cuisine}, ${restaurant.price}, ${restaurant.neighborhood}`,
    restaurant.isOpen ? 'open' : 'closed',
  ].join(', ');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Opens restaurant details"
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.images[0] }} style={styles.image} />

        {/* Single match badge — top-right, no decorative "match" label */}
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>{restaurant.tasteMatchPercent}%</Text>
        </View>

        {/* Closed state only — Open is the default and needs no marker */}
        {!restaurant.isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>Closed</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {restaurant.cuisine} · {restaurant.price} · {restaurant.neighborhood}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(RestaurantCardInner);

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    position: 'relative',
    height: 130,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  matchBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    minWidth: 38,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  closedBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  closedText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  sub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
