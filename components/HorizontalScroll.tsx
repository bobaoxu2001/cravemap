import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Spacing } from '../constants/theme';
import { Restaurant, CheckIn } from '../types';
import RestaurantCard from './RestaurantCard';

interface HorizontalScrollProps {
  restaurants: Restaurant[];
  checkIns?: CheckIn[];
}

export default function HorizontalScroll({ restaurants, checkIns }: HorizontalScrollProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {restaurants.map((r) => {
        const topCi = checkIns?.find((ci) => ci.restaurantId === r.id);
        const topCheckIn = topCi
          ? { userName: topCi.userName, hypeRating: topCi.hypeRating, review: topCi.review || undefined, tasteTags: topCi.tasteTags }
          : undefined;
        return <RestaurantCard key={r.id} restaurant={r} topCheckIn={topCheckIn} />;
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});
