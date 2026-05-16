import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckIn } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import TagChip from './TagChip';

interface CheckInCardProps {
  checkIn: CheckIn;
}

const hypeLabel: Record<CheckIn['hypeRating'], { label: string; color: string }> = {
  worth_it: { label: '✅ Worth It', color: Colors.green },
  overhyped: { label: '🚫 Overhyped', color: Colors.error },
  not_sure: { label: '🤔 Not Sure', color: Colors.textMuted },
};

export default function CheckInCard({ checkIn }: CheckInCardProps) {
  const hype = hypeLabel[checkIn.hypeRating];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: checkIn.userAvatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{checkIn.userName}</Text>
          <Text style={styles.date}>{checkIn.date}</Text>
        </View>
        {checkIn.locationVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="location" size={10} color={Colors.green} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      {checkIn.photos.length > 0 && (
        <Image source={{ uri: checkIn.photos[0] }} style={styles.photo} />
      )}

      <Text style={styles.review} numberOfLines={4}>{checkIn.review}</Text>

      <View style={styles.tagsRow}>
        {checkIn.tasteTags.slice(0, 3).map((tag) => (
          <TagChip key={tag} label={tag} variant="primary" />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.hypeLabel, { color: hype.color }]}>{hype.label}</Text>
        <View style={styles.helpfulRow}>
          <Ionicons name="thumbs-up-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.helpfulCount}>{checkIn.helpful}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '600',
  },
  date: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  verifiedText: {
    ...Typography.caption,
    color: Colors.green,
    fontWeight: '500',
  },
  photo: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  review: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hypeLabel: {
    ...Typography.label,
    fontWeight: '600',
  },
  helpfulRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpfulCount: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
