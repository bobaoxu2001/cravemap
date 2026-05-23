import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface RestaurantCardProps {
  restaurant: Restaurant;
  topCheckIn?: { userName: string; hypeRating: string; review?: string; tasteTags?: string[] };
}

export default function RestaurantCard({ restaurant, topCheckIn }: RestaurantCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/restaurant/${restaurant.id}`);
  };

  const matchColor =
    restaurant.tasteMatchPercent >= 90
      ? Colors.green
      : restaurant.tasteMatchPercent >= 75
      ? '#FF8A00'
      : Colors.textMuted;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.92}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.images[0] }} style={styles.image} />

        {/* Gradient-style scrim at top for badges */}
        <View style={styles.topScrim} />

        {/* Status badges — top row */}
        <View style={styles.topRow}>
          <View style={[styles.openBadge, { backgroundColor: restaurant.isOpen ? Colors.green : 'rgba(0,0,0,0.45)' }]}>
            <View style={[styles.openDot, { backgroundColor: restaurant.isOpen ? '#fff' : Colors.textMuted }]} />
            <Text style={styles.openText}>{restaurant.isOpen ? 'Open' : 'Closed'}</Text>
          </View>
          {restaurant.waitTime && (
            <View style={styles.waitBadge}>
              <Ionicons name="time-outline" size={10} color="#fff" />
              <Text style={styles.waitText}>{restaurant.waitTime}</Text>
            </View>
          )}
        </View>

        {/* Taste match badge — bottom left */}
        <View style={[styles.matchBadge, { borderColor: matchColor }]}>
          <Text style={[styles.matchBadgePercent, { color: matchColor }]}>
            {restaurant.tasteMatchPercent}%
          </Text>
          <Text style={styles.matchBadgeLabel}>match</Text>
        </View>

        {/* Gradient scrim at bottom for cuisine info */}
        <View style={styles.bottomScrim} />
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
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeText}>🏘️ {restaurant.localApprovedPercent}% local</Text>
          </View>
          <Text style={styles.trustDot}>·</Text>
          <Text style={styles.trustText}>✅ {restaurant.verifiedCheckIns.toLocaleString()}</Text>
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
        {topCheckIn && (
          <View style={styles.snippetRow}>
            <Text style={styles.snippetQuote} numberOfLines={2}>
              {topCheckIn.hypeRating === 'worth_it' ? '✅' : topCheckIn.hypeRating === 'overhyped' ? '🚫' : '🤔'}{' '}
              {topCheckIn.review ? `"${topCheckIn.review}"` : topCheckIn.tasteTags?.join(' · ') ?? ''}
            </Text>
            <Text style={styles.snippetAuthor}>— {topCheckIn.userName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 265,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    height: 178,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'transparent',
    // Simulate gradient with a dark-to-transparent overlay
    // Using a layered approach: slightly dark at top
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.0)',
  },
  topRow: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  openText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  waitText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  matchBadge: {
    position: 'absolute',
    bottom: 36,
    left: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  matchBadgePercent: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  matchBadgeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  cuisineBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.60)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
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
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: 110,
  },
  imageTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: Spacing.sm + 2,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  trustBadge: {
    backgroundColor: Colors.warmBackground,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trustBadgeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  trustDot: {
    ...Typography.caption,
    color: Colors.textMuted,
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
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },
  socialSignal: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  snippetRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  snippetQuote: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  snippetAuthor: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
});
