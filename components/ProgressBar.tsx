import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export default function ProgressBar({
  progress,
  height = 6,
  color = Colors.primary,
  backgroundColor = Colors.border,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});
