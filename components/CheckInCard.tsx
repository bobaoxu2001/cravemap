import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckIn } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { CheckInEntrance } from './CheckInAnimation';
import ReportModal from './ReportModal';

interface CheckInCardProps {
  checkIn: CheckIn;
  /** Optional helpful-action props. Card stays read-only when omitted. */
  onMarkHelpful?: (checkInId: string) => void;
  helpfulLoading?: boolean;
  helpfulMarked?: boolean;
  /** When true, show a small NEW marker (no sparkle overlay). */
  highlightNew?: boolean;
  /** Stagger delay for entrance reveal (ms). */
  entranceDelay?: number;
  /** When provided, show the ⋯ report/block menu. */
  onBlocked?: (userId: string) => void;
}

// Minimalist hype labels — text only, no emoji, no bg color
const hypeLabel: Record<CheckIn['hypeRating'], { label: string; color: string }> = {
  worth_it: { label: 'Worth It',  color: Colors.green },
  overhyped: { label: 'Overhyped', color: Colors.error },
  not_sure: { label: 'Not sure',  color: Colors.textMuted },
};

/**
 * Minimalist check-in card. Shows: avatar + name + date, photo (if any),
 * review text, single hype label, helpful button. Dropped:
 *   - Repeat visitor / would-return / not-coming-back pills
 *   - User bio line, ordered items line
 *   - Taste tag chips row
 *   - Sparkle overlay & highlighted background tint
 * Those secondary details still live on the Restaurant Detail full view.
 *
 * Wrapped in React.memo — feeds on Restaurant Detail can render dozens of
 * cards, and the parent re-renders when a new check-in is posted or
 * "mark helpful" mutates a sibling. Memoizing skips the unchanged cards.
 */
function CheckInCardInner({
  checkIn,
  onMarkHelpful,
  helpfulLoading = false,
  helpfulMarked = false,
  highlightNew = false,
  entranceDelay = 0,
  onBlocked,
}: CheckInCardProps) {
  const [reportVisible, setReportVisible] = useState(false);
  const hype = hypeLabel[checkIn.hypeRating];
  const helpfulInteractive = typeof onMarkHelpful === 'function';
  const helpfulDisabled = helpfulLoading || helpfulMarked;

  const handleHelpfulPress = () => {
    if (!onMarkHelpful || helpfulDisabled) return;
    onMarkHelpful(checkIn.id);
  };

  return (
    <CheckInEntrance delay={entranceDelay} highlight={false}>
      <View style={styles.container}>
        {highlightNew && (
          <View style={styles.newBadge} pointerEvents="none">
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        <View style={styles.header}>
          <Image source={{ uri: checkIn.userAvatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{checkIn.userName}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {checkIn.date}{checkIn.locationVerified ? ' · Verified visit' : ''}
            </Text>
          </View>
          <Text style={[styles.hypeLabel, { color: hype.color }]}>{hype.label}</Text>
        </View>

        {checkIn.photos.length > 0 && (
          <Image source={{ uri: checkIn.photos[0] }} style={styles.photo} />
        )}

        <Text style={styles.review} numberOfLines={5}>{checkIn.review}</Text>

        <View style={styles.footer}>
          {/* ⋯ report/block menu — visible whenever onBlocked is supplied,
              which indicates the check-in is in a public feed (not a preview). */}
          <TouchableOpacity
            onPress={() => setReportVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.reportBtn}
            accessibilityRole="button"
            accessibilityLabel="Report or block options for this check-in"
          >
            <Ionicons name="ellipsis-horizontal" size={14} color={Colors.textMuted} />
          </TouchableOpacity>

          {helpfulInteractive ? (
            <TouchableOpacity
              onPress={handleHelpfulPress}
              disabled={helpfulDisabled}
              activeOpacity={0.7}
              style={[
                styles.helpfulBtn,
                helpfulDisabled && !helpfulMarked && styles.helpfulBtnDisabled,
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={
                helpfulMarked
                  ? `You marked this check-in helpful. ${checkIn.helpful} people found it helpful.`
                  : `Mark this check-in helpful. ${checkIn.helpful} people have so far.`
              }
              accessibilityState={{ disabled: helpfulDisabled, selected: helpfulMarked }}
              accessibilityHint={helpfulMarked ? undefined : 'Adds 1 to the helpful count'}
            >
              {helpfulLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name={helpfulMarked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={14}
                  color={helpfulMarked ? Colors.primary : Colors.textMuted}
                />
              )}
              <Text style={[styles.helpfulCount, helpfulMarked && styles.helpfulCountMarked]}>
                {checkIn.helpful} helpful
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={styles.helpfulRow}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${checkIn.helpful} people found this helpful`}
            >
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
  },
  newBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    zIndex: 2,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '600',
  },
  meta: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 1,
  },
  hypeLabel: {
    ...Typography.caption,
    fontWeight: '600',
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
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
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
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  helpfulBtnDisabled: {
    opacity: 0.6,
  },
  helpfulCountMarked: {
    color: Colors.primary,
    fontWeight: '600',
  },
  reportBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: Spacing.sm,
  },
});

export default React.memo(CheckInCardInner);
