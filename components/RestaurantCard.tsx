import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import TasteMatchBadge from './TasteMatchBadge';
import TagChip from './TagChip';

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
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.sub} numberOfLines={1}>{restaurant.neighborhood} · {restaurant.cuisine}</Text>
        <Text style={styles.price}>{restaurant.price}</Text>

        <View style={styles.badgeRow}>
          <TasteMatchBadge percent={restaurant.tasteMatchPercent} />
          <View style={styles.localBadge}>
            <Text style={styles.localText}>{restaurant.localApprovedPercent}% local</Text>
          </View>
        </View>

        <View style={styles.checkInsRow}>
          <Ionicons name="checkmark-circle-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.checkInsText}>{restaurant.verifiedCheckIns.toLocaleString()} check-ins</Text>
        </View>

        <View style={styles.tagsRow}>
          {restaurant.tags.slice(0, 2).map((tag) => (
            <TagChip key={tag} label={tag} variant="neutral" size="sm" />
          ))}
        </View>

        <Text style={styles.reason} numberOfLines={2}>{restaurant.recommendationReason}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
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
    height: 130,
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
    ...Typography.h3,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  sub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  price: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  localBadge: {
    backgroundColor: '#FFF4E6',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  localText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
  },
  checkInsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: Spacing.xs,
  },
  checkInsText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xs,
  },
  reason: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
