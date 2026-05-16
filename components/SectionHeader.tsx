import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  emoji?: string;
  onSeeAll?: () => void;
}

export default function SectionHeader({ title, emoji, onSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {emoji ? `${emoji} ${title}` : title}
      </Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
  },
  seeAll: {
    ...Typography.label,
    color: Colors.primary,
  },
});
