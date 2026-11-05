import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Restaurant, CheckIn } from '../../types';
import { getRestaurantById } from '../../src/services/restaurants';
import { getCheckInsByRestaurantId, markHelpful, getHelpfulCheckInIds } from '../../src/services/checkIns';
import {
  isRestaurantSaved,
  saveRestaurant,
  unsaveRestaurant,
} from '../../src/services/saved';
import { useAuth } from '../../src/hooks/useAuth';
import { getBlockedUserIds } from '../../src/services/blocks';
import {
  computeTasteMatch,
  getDecisionHeadline,
  getPrimaryOrder,
  getRecommendationProof,
} from '../../src/lib/recommendations';
import { getRestaurantShareUrl } from '../../src/lib/links';
import CheckInCard from '../../components/CheckInCard';

const DEMO_USER_ID = 'u001';

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, isSupabaseMode, profile } = useAuth();
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  // Track per-check-in marked-helpful + in-flight state for this session.
  const [helpfulMarked, setHelpfulMarked] = useState<Record<string, boolean>>({});
  const [helpfulLoading, setHelpfulLoading] = useState<Record<string, boolean>>({});
  // IDs of users the current user has blocked — filtered out of the check-in feed.
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  // Personalized taste-match for this user. Falls back to the restaurant's
  // baseline when the passport isn't complete (returns 0 if no restaurant).
  const personalizedMatch = useMemo(
    () => (restaurant ? computeTasteMatch(restaurant, profile) : 0),
    [restaurant, profile]
  );

  const loadData = useCallback(() => {
    // Load blocked IDs in parallel so we can filter them from the feed.
    void getBlockedUserIds().then((ids) => setBlockedUserIds(new Set(ids)));

    Promise.all([getRestaurantById(id), getCheckInsByRestaurantId(id)])
      .then(([r, c]) => {
        setRestaurant(r ?? null);
        setCheckIns(c);
        // Seed the per-session helpful-marked map from the DB so already-marked
        // check-ins render with the filled thumbs-up on mount rather than on
        // first press. userId may be null in mock mode; service handles it.
        const uid = userId;
        if (c.length > 0) {
          getHelpfulCheckInIds(uid ?? 'u001', c.map((ci) => ci.id))
            .then((markedIds) => {
              if (markedIds.length === 0) return;
              setHelpfulMarked((prev) => {
                const next = { ...prev };
                markedIds.forEach((mid) => { next[mid] = true; });
                return next;
              });
            })
            .catch(() => { /* non-fatal — fall through */ });
        }
      })
      .finally(() => setLoading(false));
  }, [id, userId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Re-fetch check-ins when navigating back from the check-in screen so a
  // just-posted check-in appears immediately with the NEW highlight.
  useFocusEffect(useCallback(() => {
    if (!loading) {
      getCheckInsByRestaurantId(id).then(setCheckIns).catch(() => {});
    }
    // We intentionally omit `loading` from deps — this fires once on focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]));

  // Initialize saved state once restaurant ID and userId are known.
  useEffect(() => {
    if (!id || !userId) return;
    isRestaurantSaved(userId, id)
      .then(setSaved)
      .catch(() => { /* leave as false on error */ });
  }, [id, userId]);

  const handleToggleSave = useCallback(async () => {
    if (isSupabaseMode && !userId) {
      Alert.alert(
        'Sign in required',
        'Create an account to save restaurants.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.replace('/onboarding/welcome') },
        ]
      );
      return;
    }

    if (!userId || saveLoading) return;

    const next = !saved;
    setSaved(next);
    setSaveLoading(true);

    // Show a brief inline toast so the action ↔ result connection is obvious.
    // The bookmark color change alone is easy to miss; copy spells out the
    // next-step ("view in Saved tab").
    setToastMsg(next ? 'Saved — view in the Saved tab' : 'Removed from Saved');
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);

    try {
      if (next) {
        await saveRestaurant(userId, id);
      } else {
        await unsaveRestaurant(userId, id);
      }
    } catch {
      setSaved(!next); // rollback on failure
      setToastMsg('Could not save. Try again.');
    } finally {
      setSaveLoading(false);
    }
  }, [id, isSupabaseMode, router, saved, saveLoading, userId]);

  const handleMarkHelpful = useCallback(async (checkInId: string) => {
    if (!checkInId) return;
    if (helpfulLoading[checkInId] || helpfulMarked[checkInId]) return;

    if (isSupabaseMode && !userId) {
      Alert.alert(
        'Sign in required',
        'Create an account to mark check-ins helpful.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.replace('/onboarding/welcome') },
        ]
      );
      return;
    }

    // Optimistic UI: bump count, mark, flip loading.
    setHelpfulLoading((prev) => ({ ...prev, [checkInId]: true }));
    setHelpfulMarked((prev) => ({ ...prev, [checkInId]: true }));
    setCheckIns((prev) =>
      prev.map((c) => (c.id === checkInId ? { ...c, helpful: c.helpful + 1 } : c))
    );

    try {
      const result = await markHelpful(checkInId);
      if (!result.success) {
        // Rollback on failure
        setHelpfulMarked((prev) => ({ ...prev, [checkInId]: false }));
        setCheckIns((prev) =>
          prev.map((c) => (c.id === checkInId ? { ...c, helpful: Math.max(c.helpful - 1, 0) } : c))
        );
        Alert.alert('Could not mark helpful', result.error ?? 'Please try again.');
      } else {
        // Reconcile to authoritative server count
        setCheckIns((prev) =>
          prev.map((c) => (c.id === checkInId ? { ...c, helpful: result.helpfulCount } : c))
        );
      }
    } catch (err) {
      setHelpfulMarked((prev) => ({ ...prev, [checkInId]: false }));
      setCheckIns((prev) =>
        prev.map((c) => (c.id === checkInId ? { ...c, helpful: Math.max(c.helpful - 1, 0) } : c))
      );
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Could not mark helpful', message);
    } finally {
      setHelpfulLoading((prev) => ({ ...prev, [checkInId]: false }));
    }
  }, [helpfulLoading, helpfulMarked, isSupabaseMode, router, userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>Loading restaurant…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Restaurant not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const openMaps = () => {
    const url = `https://maps.apple.com/?q=${encodeURIComponent(restaurant.address)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open Maps', restaurant.address)
    );
  };

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel with explicit "1 / N" counter — small white dots
            are easy to miss, so users may not realize there are more photos. */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: restaurant.images[imageIndex] }} style={styles.image} />
          {restaurant.images.length > 1 && (
            <>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {imageIndex + 1} / {restaurant.images.length}
                </Text>
              </View>
              <View style={styles.dots}>
                {restaurant.images.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dot, i === imageIndex && styles.dotActive]}
                    onPress={() => setImageIndex(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Photo ${i + 1} of ${restaurant.images.length}`}
                    accessibilityState={{ selected: i === imageIndex }}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Back & Save overlays */}
        <View style={styles.overlayButtons}>
          <TouchableOpacity
            style={styles.overlayBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Returns to the previous screen"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.overlayBtn}
            onPress={handleToggleSave}
            disabled={saveLoading}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from saved' : 'Save restaurant'}
            accessibilityState={{ disabled: saveLoading, selected: saved }}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? Colors.primary : Colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Main content card */}
        <View style={styles.contentCard}>
          {/* Minimalist header: name + meta + a single "Closed" pill (open
              is the default; no positive pill needed). Match%/local%/visits
              stats consolidated into one quiet sub-line below. */}
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <Text style={styles.sub}>{restaurant.cuisine} · {restaurant.price} · {restaurant.neighborhood}</Text>
            </View>
            {!restaurant.isOpen && (
              <View style={[styles.openBadge, { backgroundColor: '#F5F5F5' }]}>
                <Text style={[styles.openText, { color: Colors.textMuted }]}>Closed</Text>
              </View>
            )}
          </View>

          {/* Each number is labelled with WHAT it measures, so users don't
              have to guess. "match for you" = personalized; "local approve" =
              social proof from neighbors; "visits" = real check-in volume. */}
          <Text style={styles.statsLine}>
            {personalizedMatch}% match for you · {restaurant.localApprovedPercent}% locals approve · {restaurant.verifiedCheckIns.toLocaleString()} verified visits
          </Text>

          <View style={styles.divider} />

          <View style={styles.decisionCard}>
            <View style={styles.decisionHeader}>
              <Ionicons name="sparkles-outline" size={17} color={Colors.primary} />
              <Text style={styles.decisionTitle}>
                {getDecisionHeadline({ ...restaurant, tasteMatchPercent: personalizedMatch })}
              </Text>
            </View>
            <Text style={styles.decisionOrder}>Order first: {getPrimaryOrder(restaurant)}</Text>
            {getRecommendationProof({ ...restaurant, tasteMatchPercent: personalizedMatch }, profile).map((line) => (
              <View key={line} style={styles.proofRow}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                <Text style={styles.proofText}>{line}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.description}>{restaurant.description}</Text>

          {(restaurant.insiderTip || (restaurant.whatLocalsOrder && restaurant.whatLocalsOrder.length > 0) || restaurant.bestTimeToGo) && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Local intel</Text>
              <Text style={styles.sectionSub}>Tips from people who eat here regularly</Text>

              {restaurant.insiderTip && (
                <View style={styles.tipCard}>
                  <View style={styles.tipHeader}>
                    <Ionicons name="bulb" size={16} color="#B8860B" />
                    <Text style={styles.tipLabel}>Insider tip</Text>
                  </View>
                  <Text style={styles.tipBody}>{restaurant.insiderTip}</Text>
                </View>
              )}

              {restaurant.whatLocalsOrder && restaurant.whatLocalsOrder.length > 0 && (
                <View style={styles.localsBlock}>
                  <Text style={styles.localsHeader}>What locals order</Text>
                  {restaurant.whatLocalsOrder.map((item, idx) => (
                    <View key={item} style={styles.localsRow}>
                      <Text style={styles.localsNum}>{idx + 1}.</Text>
                      <Text style={styles.localsItem}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {restaurant.bestTimeToGo && (
                <View style={styles.bestTimeCard}>
                  <Text style={styles.bestTimeLabel}>Best time to go</Text>
                  <Text style={styles.bestTimeBody}>{restaurant.bestTimeToGo}</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.divider} />

          {/* Tags section dropped — cuisine + price + neighborhood in the
              header line + the Best-for column already convey the same
              information. Tags chip row was visual repetition. */}

          {/* Info grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>{restaurant.address}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>{restaurant.hours}</Text>
            </View>
            {restaurant.phone && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={16} color={Colors.primary} />
                <Text style={styles.infoText}>{restaurant.phone}</Text>
              </View>
            )}
            {restaurant.waitTime && (
              <View style={styles.infoItem}>
                <Ionicons name="hourglass-outline" size={16} color={Colors.primary} />
                <Text style={styles.infoText}>Typical wait: {restaurant.waitTime}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Best for / Avoid if */}
          <View style={styles.twoColSection}>
            <View style={[styles.twoColItem, styles.bestForBox]}>
              <Text style={styles.sectionTitle}>Best for</Text>
              {restaurant.bestFor.map((item) => (
                <View key={item} style={styles.iconItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
                  <Text style={styles.iconItemText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.twoColItem, styles.avoidIfBox]}>
              <Text style={styles.sectionTitle}>Avoid if</Text>
              {restaurant.avoidIf.map((item) => (
                <View key={item} style={styles.iconItem}>
                  <Ionicons name="close-circle" size={16} color="#C44545" />
                  <Text style={styles.iconItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Check-in Feed — wordy subtitle dropped; helpfulness sort is implicit */}
          <Text style={styles.sectionTitle}>Check-ins ({checkIns.length})</Text>
          {checkIns.length > 0 ? (
            (() => {
              const today = new Date().toISOString().split('T')[0];
              const visible = checkIns.filter((ci) => !blockedUserIds.has(ci.userId));
              return visible
                .sort((a, b) => b.helpful - a.helpful)
                .map((ci, idx) => (
                  <CheckInCard
                    key={ci.id}
                    checkIn={ci}
                    onMarkHelpful={handleMarkHelpful}
                    helpfulLoading={!!helpfulLoading[ci.id]}
                    helpfulMarked={!!helpfulMarked[ci.id]}
                    highlightNew={ci.date === today}
                    entranceDelay={Math.min(idx, 6) * 80}
                    onBlocked={(userId) => {
                      setBlockedUserIds((prev) => new Set([...prev, userId]));
                    }}
                  />
                ));
            })()
          ) : (
            <View style={styles.noCheckIns}>
              <Text style={styles.noCheckInsText}>
                No check-ins yet. Tap "Check in" below to share photos and a quick review — yours will be the first.
              </Text>
            </View>
          )}

          {/* Bottom spacer for action bar */}
          <View style={styles.actionBarSpacer} />
        </View>
      </ScrollView>

      {/* Inline toast — appears above the action bar after Save/Unsave.
          Auto-dismisses in 2.2s. */}
      {toastMsg && (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Fixed action bar — each icon now carries a tiny label so users
          don't have to guess what each button does (camera vs. compass icon
          is not self-explanatory). */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionIconCol}
          onPress={handleToggleSave}
          disabled={saveLoading}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save restaurant'}
          accessibilityState={{ disabled: saveLoading, selected: saved }}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? Colors.primary : Colors.text} />
          <Text style={[styles.actionIconLabel, saved && { color: Colors.primary }]}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => router.push({ pathname: '/check-in', params: { restaurantId: restaurant.id } })}
          accessibilityRole="button"
          accessibilityLabel="Check in"
          accessibilityHint={`Open the check-in flow for ${restaurant.name}`}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={[styles.actionBtnText, { color: '#fff' }]}>Check in</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionIconCol}
          onPress={openMaps}
          accessibilityRole="button"
          accessibilityLabel="Directions"
          accessibilityHint={`Open ${restaurant.name} in the Maps app`}
        >
          <Ionicons name="navigate-outline" size={20} color={Colors.text} />
          <Text style={styles.actionIconLabel}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionIconCol}
          onPress={async () => {
            // Real share — points at the web landing page so recipients
            // without the app see a "Download" CTA instead of a dead
            // cravemap:// link. The page itself attempts the deep link
            // for users who already have the app installed.
            try {
              const url = getRestaurantShareUrl(restaurant.id);
              await Share.share({
                message: `${restaurant.name} · ${restaurant.cuisine} · ${restaurant.neighborhood}\n\n${url}`,
                title: restaurant.name,
                url,
              });
            } catch {
              // User cancelled or share is unavailable — no-op.
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={`Share ${restaurant.name}`}
        >
          <Ionicons name="share-outline" size={20} color={Colors.text} />
          <Text style={styles.actionIconLabel}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  notFoundText: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  backBtnText: {
    ...Typography.label,
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    height: 260,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  imageCounter: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  imageCounterText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  overlayButtons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  overlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  contentCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -20,
    padding: Spacing.lg,
    minHeight: 400,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  nameBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 4,
  },
  sub: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  statsLine: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  openBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  openText: {
    ...Typography.label,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  metricsSection: {
    gap: Spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  metricLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  metricLabel: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  checkInsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  checkInsText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  localPercBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  localPercText: {
    ...Typography.label,
    color: '#B8860B',
    fontWeight: '700',
  },
  description: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  decisionCard: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EEE5DB',
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  decisionTitle: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
  },
  decisionOrder: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 5,
  },
  proofText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  infoGrid: {
    gap: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  twoColSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  twoColItem: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  bestForBox: {
    backgroundColor: '#E8F5EE',
  },
  avoidIfBox: {
    backgroundColor: '#FFF0F0',
  },
  iconItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  iconItemText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  bulletItem: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  bulletDot: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  tipCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#B8860B',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipLabel: {
    ...Typography.label,
    color: '#B8860B',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tipBody: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 20,
  },
  localsBlock: {
    marginBottom: Spacing.sm,
  },
  localsHeader: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  localsSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  localsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 6,
  },
  localsNum: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '700',
    width: 18,
  },
  localsItem: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  mustTry: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mustTryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bestTimeCard: {
    backgroundColor: '#E8F5EE',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  bestTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  bestTimeLabel: {
    ...Typography.label,
    color: Colors.green,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestTimeBody: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 20,
  },
  noCheckIns: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noCheckInsText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  actionBarSpacer: {
    height: 80,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    paddingBottom: 28,
  },
  toast: {
    position: 'absolute',
    bottom: 108,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  toastText: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '500',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  actionBtnText: {
    ...Typography.label,
    fontWeight: '600',
  },
  actionIconCol: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  actionIconLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
