import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Spacing } from '../constants/theme';
import { Restaurant } from '../types';
import RestaurantCard from './RestaurantCard';

interface HorizontalScrollProps {
  restaurants: Restaurant[];
}

export default function HorizontalScroll({ restaurants }: HorizontalScrollProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {restaurants.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});
