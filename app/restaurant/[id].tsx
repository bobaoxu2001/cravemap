import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { mockRestaurants } from '../../data/mockRestaurants';
import { mockCheckIns } from '../../data/mockCheckIns';
import TagChip from '../../components/TagChip';
import CheckInCard from '../../components/CheckInCard';

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const restaurant = mockRestaurants.find((r) => r.id === id);
  if (!restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Restaurant not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const restaurantCheckIns = mockCheckIns.filter((c) => c.restaurantId === id);

  const openMaps = () => {
    const url = `https://maps.apple.com/?q=${encodeURIComponent(restaurant.address)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open Maps', restaurant.address)
    );
  };

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: restaurant.images[imageIndex] }} style={styles.image} />
          {/* Dot indicator */}
          {restaurant.images.length > 1 && (
            <View style={styles.dots}>
              {restaurant.images.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dot, i === imageIndex && styles.dotActive]}
                  onPress={() => setImageIndex(i)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Back & Save overlays */}
        <View style={styles.overlayButtons}>
          <TouchableOpacity
            style={styles.overlayBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.overlayBtn}
            onPress={() => setSaved(!saved)}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? Colors.primary : Colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Main content card */}
        <View style={styles.contentCard}>
          {/* Name & basic info */}
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <Text style={styles.sub}>{restaurant.neighborhood} · {restaurant.cuisine} · {restaurant.price}</Text>
            </View>
            <View style={[styles.openBadge, { backgroundColor: restaurant.isOpen ? '#E8F5EE' : '#F5F5F5' }]}>
              <Text style={[styles.openText, { color: restaurant.isOpen ? Colors.green : Colors.textMuted }]}>
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Trust Strip */}
          <View style={styles.trustStrip}>
            <View style={styles.trustStat}>
              <Text style={[styles.trustStatValue, { color: Colors.green }]}>{restaurant.tasteMatchPercent}%</Text>
              <Text style={styles.trustStatLabel}>Taste Match</Text>
              <Text style={styles.trustStatSub}>for you</Text>
            </View>
            <View style={styles.trustStat}>
              <Text style={[styles.trustStatValue, { color: Colors.accent }]}>{restaurant.localApprovedPercent}%</Text>
              <Text style={styles.trustStatLabel}>Local Trust</Text>
              <Text style={styles.trustStatSub}>of locals approve</Text>
            </View>
            <View style={styles.trustStat}>
              <Text style={[styles.trustStatValue, { color: Colors.primary }]}>{restaurant.verifiedCheckIns.toLocaleString()}</Text>
              <Text style={styles.trustStatLabel}>Verified Visits</Text>
              <Text style={styles.trustStatSub}>real check-ins</Text>
            </View>
          </View>

          <View style={styles.reasonCard}>
            <Text style={styles.reasonText}>💡 {restaurant.recommendationReason}</Text>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.description}>{restaurant.description}</Text>

          <View style={styles.divider} />

          {/* Tags */}
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsWrap}>
            {restaurant.tags.map((tag) => (
              <TagChip key={tag} label={tag} variant="primary" size="md" />
            ))}
          </View>

          <View style={styles.divider} />

          {/* Info grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>{restaurant.address}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>{restaurant.hours}</Text>
            </View>
            {restaurant.phone && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={16} color={Colors.primary} />
                <Text style={styles.infoText}>{restaurant.phone}</Text>
              </View>
            )}
            {restaurant.waitTime && (
              <View style={styles.infoItem}>
                <Ionicons name="hourglass-outline" size={16} color={Colors.primary} />
                <Text style={styles.infoText}>Typical wait: {restaurant.waitTime}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Best for / Avoid if */}
          <View style={styles.twoColSection}>
            <View style={[styles.twoColItem, styles.bestForBox]}>
              <Text style={styles.sectionTitle}>Best for</Text>
              {restaurant.bestFor.map((item) => (
                <View key={item} style={styles.iconItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
                  <Text style={styles.iconItemText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.twoColItem, styles.avoidIfBox]}>
              <Text style={styles.sectionTitle}>Avoid if</Text>
              {restaurant.avoidIf.map((item) => (
                <View key={item} style={styles.iconItem}>
                  <Ionicons name="close-circle" size={16} color="#C44545" />
                  <Text style={styles.iconItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Check-in Feed */}
          <Text style={styles.sectionTitle}>From people who&apos;ve actually been</Text>
          <Text style={styles.checkInSub}>
            {restaurantCheckIns.length} verified visit{restaurantCheckIns.length === 1 ? '' : 's'} · sorted by helpfulness
          </Text>
          {restaurantCheckIns.length > 0 ? (
            [...restaurantCheckIns]
              .sort((a, b) => b.helpful - a.helpful)
              .map((ci) => <CheckInCard key={ci.id} checkIn={ci} />)
          ) : (
            <View style={styles.noCheckIns}>
              <Text style={styles.noCheckInsText}>Be the first to check in here!</Text>
            </View>
          )}

          {/* Bottom spacer for action bar */}
          <View style={styles.actionBarSpacer} />
        </View>
      </ScrollView>

      {/* Fixed action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => setSaved(!saved)}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? Colors.primary : Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => router.push('/check-in')}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <View>
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Check In</Text>
            <Text style={styles.actionBtnIncentive}>+200 pts</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIconBtn} onPress={openMaps}>
          <Ionicons name="navigate-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => Alert.alert('Share', `Share ${restaurant.name} with friends?`)}
        >
          <Ionicons name="share-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  notFoundText: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  backBtnText: {
    ...Typography.label,
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    height: 260,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  overlayButtons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  overlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  contentCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -20,
    padding: Spacing.lg,
    minHeight: 400,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  nameBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 4,
  },
  sub: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  openBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  openText: {
    ...Typography.label,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  metricsSection: {
    gap: Spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  metricLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  metricLabel: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  checkInsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  checkInsText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  localPercBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  localPercText: {
    ...Typography.label,
    color: '#B8860B',
    fontWeight: '700',
  },
  description: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoGrid: {
    gap: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  twoColSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  twoColItem: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  bestForBox: {
    backgroundColor: '#E8F5EE',
  },
  avoidIfBox: {
    backgroundColor: '#FFF0F0',
  },
  iconItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  iconItemText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  trustStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  trustStat: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  trustStatValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  trustStatLabel: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  trustStatSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  reasonCard: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  reasonText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 20,
  },
  checkInSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
  },
  actionBtnIncentive: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  bulletItem: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  bulletDot: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  noCheckIns: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noCheckInsText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  actionBarSpacer: {
    height: 80,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    paddingBottom: 28,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  actionBtnText: {
    ...Typography.label,
    fontWeight: '600',
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
