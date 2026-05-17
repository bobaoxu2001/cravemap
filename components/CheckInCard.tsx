import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckIn } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import TagChip from './TagChip';

interface CheckInCardProps {
  checkIn: CheckIn;
}

const hypeLabel: Record<CheckIn['hypeRating'], { label: string; color: string; bg: string; emoji: string }> = {
  worth_it: { label: 'Worth It', color: Colors.green, bg: '#E8F5EE', emoji: '✅' },
  overhyped: { label: 'Overhyped', color: Colors.error, bg: '#FFF0F0', emoji: '🚫' },
  not_sure: { label: 'Not Sure', color: Colors.textMuted, bg: '#F0F0F0', emoji: '🤔' },
};

export default function CheckInCard({ checkIn }: CheckInCardProps) {
  const hype = hypeLabel[checkIn.hypeRating];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: checkIn.userAvatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{checkIn.userName}</Text>
            {checkIn.isRepeatVisit && (
              <View style={styles.repeatPill}>
                <Text style={styles.repeatPillText}>🔁 Repeat visitor</Text>
              </View>
            )}
          </View>
          <Text style={[styles.contextText, checkIn.locationVerified && styles.contextTextVerified]}>
            {checkIn.locationVerified ? 'Verified visit · Local' : 'Verified by review'}
          </Text>
          {checkIn.userBio && (
            <Text style={styles.userBio} numberOfLines={1}>{checkIn.userBio}</Text>
          )}
          <Text style={styles.date}>{checkIn.date}</Text>
        </View>
        <View style={styles.hypeColumn}>
          <View style={[styles.hypePill, { backgroundColor: hype.bg }]}>
            <Text style={styles.hypeEmoji}>{hype.emoji}</Text>
            <Text style={[styles.hypeLabel, { color: hype.color }]}>{hype.label}</Text>
          </View>
          {checkIn.wouldReturn === true && (
            <View style={styles.returnPill}>
              <Text style={styles.returnPillText}>Would return</Text>
            </View>
          )}
          {checkIn.wouldReturn === false && (
            <View style={styles.noReturnPill}>
              <Text style={styles.noReturnPillText}>Not coming back</Text>
            </View>
          )}
        </View>
      </View>

      {checkIn.photos.length > 0 && (
        <Image source={{ uri: checkIn.photos[0] }} style={styles.photo} />
      )}

      <View style={styles.reviewBlock}>
        <Text style={styles.review} numberOfLines={5}>{checkIn.review}</Text>
      </View>

      {checkIn.orderedItems && checkIn.orderedItems.length > 0 && (
        <Text style={styles.orderedLine} numberOfLines={2}>
          <Text style={styles.orderedPrefix}>Ordered: </Text>
          {checkIn.orderedItems.join(', ')}
        </Text>
      )}

      <View style={styles.tagsRow}>
        {checkIn.tasteTags.slice(0, 3).map((tag) => (
          <TagChip key={tag} label={tag} variant="primary" />
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.helpfulRow}>
          <Ionicons name="thumbs-up-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.helpfulCount}>{checkIn.helpful} helpful</Text>
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
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  contextText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 1,
  },
  contextTextVerified: {
    color: Colors.green,
    fontWeight: '600',
  },
  repeatPill: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  repeatPillText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  hypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  hypeEmoji: {
    fontSize: 13,
  },
  reviewBlock: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    paddingLeft: Spacing.sm,
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
  userBio: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 1,
  },
  hypeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  returnPill: {
    backgroundColor: '#E8F5EE',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  returnPillText: {
    fontSize: 10,
    color: Colors.green,
    fontWeight: '700',
  },
  noReturnPill: {
    backgroundColor: '#F0F0F0',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  noReturnPillText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  orderedLine: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 17,
  },
  orderedPrefix: {
    fontWeight: '700',
    color: Colors.text,
  },
});
