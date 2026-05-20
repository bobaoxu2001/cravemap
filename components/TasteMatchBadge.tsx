import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Typography } from '../constants/theme';

interface TasteMatchBadgeProps {
  percent: number;
  showLabel?: boolean;
}

function getColor(percent: number): string {
  if (percent >= 90) return Colors.green;
  if (percent >= 75) return Colors.primary;
  return Colors.textMuted;
}

function TasteMatchBadgeInner({ percent, showLabel = false }: TasteMatchBadgeProps) {
  const color = getColor(percent);
  return (
    <View
      style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${percent} percent taste match`}
    >
      <Text style={[styles.text, { color }]}>
        {percent}%{showLabel ? ' match' : ''}
      </Text>
    </View>
  );
}

// Memoized — appears in every restaurant card and detail screen header,
// so re-renders cost up here.
export default React.memo(TasteMatchBadgeInner);

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
