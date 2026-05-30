import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckIn } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import TagChip from './TagChip';
import ReportModal from './ReportModal';
import { CheckInEntrance, CheckInStickers, BounceOnChange } from './CheckInAnimation';

interface CheckInCardProps {
  checkIn: CheckIn;
  /** Optional helpful-action props. Card stays read-only when omitted. */
  onMarkHelpful?: (checkInId: string) => void;
  helpfulLoading?: boolean;
  helpfulMarked?: boolean;
  /** When true, show sparkle stickers + slightly bouncier entrance. */
  highlightNew?: boolean;
  /** Stagger delay for entrance reveal (ms). */
  entranceDelay?: number;
  /** When provided, the ⋯ menu opens the Report/Block modal.
      Apple Guideline 1.2: UGC apps must allow reporting + blocking. */
  onBlocked?: (userId: string) => void;
}

const hypeLabel: Record<CheckIn['hypeRating'], { label: string; color: string; bg: string; emoji: string }> = {
  worth_it: { label: 'Worth It', color: Colors.green, bg: '#E8F5EE', emoji: '✅' },
  overhyped: { label: 'Overhyped', color: Colors.error, bg: '#FFF0F0', emoji: '🚫' },
  not_sure: { label: 'Not Sure', color: Colors.textMuted, bg: '#F0F0F0', emoji: '🤔' },
};

export default function CheckInCard({
  checkIn,
  onMarkHelpful,
  helpfulLoading = false,
  helpfulMarked = false,
  highlightNew = false,
  entranceDelay = 0,
  onBlocked,
}: CheckInCardProps) {
  const hype = hypeLabel[checkIn.hypeRating];
  const helpfulInteractive = typeof onMarkHelpful === 'function';
  const helpfulDisabled = helpfulLoading || helpfulMarked;
  const [reportVisible, setReportVisible] = useState(false);

  const handleHelpfulPress = () => {
    if (!onMarkHelpful || helpfulDisabled) return;
    onMarkHelpful(checkIn.id);
  };
  return (
    <CheckInEntrance delay={entranceDelay} highlight={highlightNew}>
    <View style={[styles.container, highlightNew && styles.containerHighlighted]}>
      {highlightNew && <CheckInStickers active emoji="✨" />}
      {highlightNew && (
        <View style={styles.newBadge} pointerEvents="none">
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
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
        <View style={styles.orderedSection}>
          <Text style={styles.orderedLabel}>Ordered</Text>
          <View style={styles.orderedPills}>
            {checkIn.orderedItems.slice(0, 3).map((item) => (
              <View key={item} style={styles.orderedPill}>
                <Text style={styles.orderedPillText} numberOfLines={1}>{item}</Text>
              </View>
            ))}
            {checkIn.orderedItems.length > 3 && (
              <View style={styles.orderedPill}>
                <Text style={styles.orderedPillText}>+{checkIn.orderedItems.length - 3} more</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.tagsRow}>
        {checkIn.tasteTags.slice(0, 3).map((tag) => (
          <TagChip key={tag} label={tag} variant="primary" />
        ))}
      </View>

      <View style={styles.footer}>
        {/* Report / block — surfaces UGC moderation as required by Apple 1.2.
            Hidden when the caller didn't pass onBlocked (e.g. preview cards). */}
        {typeof onBlocked === 'function' && (
          <TouchableOpacity
            onPress={() => setReportVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.reportBtn}
            accessibilityRole="button"
            accessibilityLabel="Report or block this check-in"
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        {helpfulInteractive ? (
          <TouchableOpacity
            onPress={handleHelpfulPress}
            disabled={helpfulDisabled}
            activeOpacity={0.7}
            style={[
              styles.helpfulBtn,
              helpfulMarked && styles.helpfulBtnMarked,
              helpfulDisabled && !helpfulMarked && styles.helpfulBtnDisabled,
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {helpfulLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <BounceOnChange trigger={helpfulMarked}>
                <Ionicons
                  name={helpfulMarked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={14}
                  color={helpfulMarked ? Colors.primary : Colors.textMuted}
                />
              </BounceOnChange>
            )}
            <Text style={[styles.helpfulCount, helpfulMarked && styles.helpfulCountMarked]}>
              {checkIn.helpful} helpful
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.helpfulRow}>
            <Ionicons name="thumbs-up-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.helpfulCount}>{checkIn.helpful} helpful</Text>
          </View>
        )}
      </View>
    </View>
    <ReportModal
      visible={reportVisible}
      checkInId={checkIn.id}
      authorUserId={checkIn.userId}
      authorName={checkIn.userName}
      onClose={() => setReportVisible(false)}
      onBlocked={(userId) => {
        setReportVisible(false);
        onBlocked?.(userId);
      }}
    />
    </CheckInEntrance>
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
    overflow: 'hidden',
  },
  containerHighlighted: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFBF4',
  },
  newBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    zIndex: 2,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  reportBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  helpfulCount: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F7F5F1',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helpfulBtnMarked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.primary,
  },
  helpfulBtnDisabled: {
    opacity: 0.6,
  },
  helpfulCountMarked: {
    color: Colors.primary,
    fontWeight: '600',
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
  orderedSection: {
    marginTop: 6,
  },
  orderedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderedPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  orderedPill: {
    backgroundColor: Colors.warmBackground,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderedPillText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },
});
