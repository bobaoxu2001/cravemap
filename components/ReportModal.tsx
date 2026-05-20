import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { reportCheckIn, type ReportReason } from '../src/services/reports';
import { blockUser } from '../src/services/blocks';

interface ReportModalProps {
  visible: boolean;
  checkInId: string;
  /** User ID of the check-in author — used for block action. */
  authorUserId: string;
  authorName: string;
  onClose: () => void;
  /** Called after a successful block so the parent can hide the check-in. */
  onBlocked?: (userId: string) => void;
}

const REASONS: Array<{ key: ReportReason; label: string; icon: string }> = [
  { key: 'spam',           label: 'Spam or fake review',      icon: 'ban-outline' },
  { key: 'inappropriate',  label: 'Inappropriate content',    icon: 'alert-circle-outline' },
  { key: 'harassment',     label: 'Harassment or hate',       icon: 'warning-outline' },
  { key: 'misinformation', label: 'Misleading information',   icon: 'information-circle-outline' },
  { key: 'other',          label: 'Other',                    icon: 'ellipsis-horizontal-outline' },
];

type Step = 'menu' | 'reason' | 'details' | 'done';

/**
 * Bottom-sheet-style modal for reporting a check-in or blocking its author.
 * Three-step flow:
 *   1. Action menu  →  "Report this check-in" | "Block [name]"
 *   2. Reason picker (report path only)
 *   3. Optional details text input
 *   4. Thank-you confirmation
 *
 * Designed to be self-contained — parent just controls `visible`.
 */
export default function ReportModal({
  visible,
  checkInId,
  authorUserId,
  authorName,
  onClose,
  onBlocked,
}: ReportModalProps) {
  const [step, setStep] = useState<Step>('menu');
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('menu');
    setSelectedReason(null);
    setDetails('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleBlock = async () => {
    setLoading(true);
    setError('');
    try {
      await blockUser(authorUserId);
      setStep('done');
      onBlocked?.(authorUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not block user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) return;
    setLoading(true);
    setError('');
    try {
      await reportCheckIn(checkInId, selectedReason, details.trim() || undefined);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* ── Step: menu ── */}
          {step === 'menu' && (
            <>
              <Text style={styles.title}>What do you want to do?</Text>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => setStep('reason')}
                accessibilityRole="button"
                accessibilityLabel="Report this check-in"
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="flag-outline" size={20} color="#D97706" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionLabel}>Report this check-in</Text>
                  <Text style={styles.actionSub}>Flag for spam, harassment, or misinformation</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleBlock}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={`Block ${authorName}`}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FDECEA' }]}>
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.error} />
                  ) : (
                    <Ionicons name="ban-outline" size={20} color={Colors.error} />
                  )}
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionLabel}>Block {authorName}</Text>
                  <Text style={styles.actionSub}>Their check-ins won't appear in your feeds</Text>
                </View>
              </TouchableOpacity>

              {!!error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step: reason ── */}
          {step === 'reason' && (
            <>
              <TouchableOpacity onPress={() => setStep('menu')} style={styles.backRow}>
                <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Why are you reporting this?</Text>
              <Text style={styles.subtitle}>Your report is anonymous. We review every report within 24 hours.</Text>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.reasonRow, selectedReason === r.key && styles.reasonRowActive]}
                  onPress={() => setSelectedReason(r.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedReason === r.key }}
                  accessibilityLabel={r.label}
                >
                  <Ionicons
                    name={r.icon as any}
                    size={18}
                    color={selectedReason === r.key ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[styles.reasonLabel, selectedReason === r.key && styles.reasonLabelActive]}>
                    {r.label}
                  </Text>
                  {selectedReason === r.key && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.submitBtn, !selectedReason && styles.submitBtnDisabled]}
                onPress={() => selectedReason && setStep('details')}
                disabled={!selectedReason}
                accessibilityRole="button"
                accessibilityLabel="Next"
                accessibilityState={{ disabled: !selectedReason }}
              >
                <Text style={styles.submitBtnText}>Next</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step: details ── */}
          {step === 'details' && (
            <>
              <TouchableOpacity onPress={() => setStep('reason')} style={styles.backRow}>
                <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Any additional details?</Text>
              <Text style={styles.subtitle}>Optional — helps our team review faster.</Text>
              <TextInput
                style={styles.detailsInput}
                value={details}
                onChangeText={setDetails}
                placeholder="Describe the issue (optional)"
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={400}
                textAlignVertical="top"
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmitReport}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Submit report"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit report</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── Step: done ── */}
          {step === 'done' && (
            <View style={styles.doneContainer}>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.green} />
              </View>
              <Text style={styles.title}>
                {selectedReason ? 'Report submitted' : `${authorName} blocked`}
              </Text>
              <Text style={styles.subtitle}>
                {selectedReason
                  ? 'Thank you — our team reviews every report within 24 hours. If you see continued issues, you can also block this user.'
                  : `You won't see ${authorName}'s check-ins in your feeds. You can manage blocked users in Settings.`}
              </Text>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.md,
    ...Shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  backText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  actionSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 2,
  },
  reasonRowActive: {
    backgroundColor: Colors.secondary,
  },
  reasonLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  reasonLabelActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  detailsInput: {
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: Colors.border,
  },
  submitBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  doneContainer: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  doneIcon: {
    marginBottom: Spacing.sm,
  },
});
