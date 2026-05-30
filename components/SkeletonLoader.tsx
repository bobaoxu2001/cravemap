// Reusable shimmer-effect skeleton block.
// Used in place of ActivityIndicator on list screens so the layout
// doesn't jump when data arrives.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = BorderRadius.sm, style }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: Colors.border },
        { opacity },
        style,
      ]}
    />
  );
}

/** Skeleton that mimics the home feed: header + persona chip + search + card shelves */
export function HomeSkeleton() {
  return (
    <View style={styles.homeSafe}>
      {/* Header row */}
      <View style={styles.homeHeader}>
        <View style={styles.headerLeft}>
          <SkeletonBlock width={120} height={18} />
          <SkeletonBlock width={80} height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.headerRight}>
          <SkeletonBlock width={54} height={28} borderRadius={14} />
          <SkeletonBlock width={32} height={32} borderRadius={16} />
        </View>
      </View>

      {/* Persona chip */}
      <SkeletonBlock width='80%' height={34} borderRadius={20} style={{ marginHorizontal: 16, marginBottom: 12 }} />

      {/* Search bar */}
      <SkeletonBlock width='92%' height={44} borderRadius={12} style={{ marginHorizontal: 16, marginBottom: 16 }} />

      {/* Filter chips */}
      <View style={styles.chips}>
        {[72, 56, 90, 66].map((w, i) => (
          <SkeletonBlock key={i} width={w} height={32} borderRadius={16} />
        ))}
      </View>

      {/* Section header */}
      <SkeletonBlock width={140} height={14} style={{ marginHorizontal: 16, marginBottom: 12 }} />

      {/* Horizontal card row */}
      <View style={styles.cardRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.card}>
            <SkeletonBlock width='100%' height={120} borderRadius={12} />
            <SkeletonBlock width='70%' height={14} style={{ marginTop: 8 }} />
            <SkeletonBlock width='50%' height={11} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Section header 2 */}
      <SkeletonBlock width={160} height={14} style={{ marginHorizontal: 16, marginTop: 24, marginBottom: 12 }} />

      {/* Second card row */}
      <View style={styles.cardRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.card}>
            <SkeletonBlock width='100%' height={120} borderRadius={12} />
            <SkeletonBlock width='60%' height={14} style={{ marginTop: 8 }} />
            <SkeletonBlock width='45%' height={11} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Skeleton that mimics the saved list: header + sort row + list cards */
export function SavedSkeleton() {
  return (
    <View style={styles.savedSafe}>
      <View style={styles.savedHeader}>
        <SkeletonBlock width={80} height={20} />
        <SkeletonBlock width={100} height={28} borderRadius={14} />
      </View>
      <SkeletonBlock width='92%' height={40} borderRadius={10} style={{ marginHorizontal: 16, marginBottom: 8 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.savedCard}>
          <SkeletonBlock width={72} height={72} borderRadius={10} />
          <View style={styles.savedCardBody}>
            <SkeletonBlock width='65%' height={15} />
            <SkeletonBlock width='45%' height={12} style={{ marginTop: 5 }} />
            <SkeletonBlock width='55%' height={12} style={{ marginTop: 5 }} />
          </View>
          <SkeletonBlock width={28} height={28} borderRadius={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  homeSafe: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 8,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: { gap: 4 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  card: {
    width: 150,
    flexShrink: 0,
  },
  savedSafe: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 8,
  },
  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  savedCardBody: {
    flex: 1,
    gap: 2,
  },
});
