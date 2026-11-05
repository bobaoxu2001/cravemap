import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useStudioAuthGate } from '../../src/hooks/useStudioAuthGate';
import {
  formatMoney,
  recordManualPayment,
  recordStripePayment,
  STARTER_PACK,
} from '../../src/services/studio/payments';

// ── Theme (matches existing Studio dark palette) ──────────────────────────────

const S = {
  blue: '#3A3AFF',
  dark: '#0E0E2A',
  card: '#1E1E40',
  border: '#3A3AFF30',
  dim: '#A0A0C8',
  green: '#44CC88',
  amber: '#FFB800',
};

const SUPPORT_EMAIL = 'ax2183@nyu.edu';

export default function StudioUpgrade() {
  const router = useRouter();
  const { session } = useAuth();
  const gate = useStudioAuthGate();

  const paymentLink = process.env.EXPO_PUBLIC_STUDIO_PAYMENT_LINK;
  const hasPaymentLink = typeof paymentLink === 'string' && paymentLink.length > 0;

  const [busy, setBusy] = useState<'stripe' | 'manual' | null>(null);
  const [error, setError] = useState('');
  const [recorded, setRecorded] = useState<{ provider: string; amount: number } | null>(null);

  // ── Gate ────────────────────────────────────────────────────────────────────
  if (!gate.ready) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {gate.blocked && gate.reason === 'mock-mode' ? (
            <>
              <Text style={{ fontSize: 48 }}>🔌</Text>
              <Text style={styles.blockedTitle}>Studio needs Supabase</Text>
              <Text style={styles.blockedBody}>
                Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env to enable paid pilots.
              </Text>
            </>
          ) : (
            <ActivityIndicator color={S.blue} size="large" />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  const openStripeLink = async () => {
    if (!paymentLink) return;
    setError('');
    setBusy('stripe');
    try {
      await Linking.openURL(paymentLink);
    } catch {
      setError('Could not open the Stripe Payment Link. Check the URL in EXPO_PUBLIC_STUDIO_PAYMENT_LINK.');
    } finally {
      setBusy(null);
    }
  };

  const recordStripeReturn = async () => {
    if (!session) return;
    setError('');
    setBusy('stripe');
    try {
      const p = await recordStripePayment(session.userId);
      setRecorded({ provider: 'stripe', amount: p.amountCents });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record payment.');
    } finally {
      setBusy(null);
    }
  };

  const recordManual = async () => {
    if (!session) return;
    setError('');
    setBusy('manual');
    try {
      const p = await recordManualPayment(session.userId);
      setRecorded({ provider: 'manual', amount: p.amountCents });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record payment.');
    } finally {
      setBusy(null);
    }
  };

  const openContact = () => {
    const subject = encodeURIComponent('CraveMap Studio paid pilot');
    const body = encodeURIComponent(
      "Hi — I'd like to start the AI Restaurant Growth Starter Pack ($49) paid pilot for my restaurant.",
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {
      setError(`Could not open mail. Email ${SUPPORT_EMAIL} directly.`);
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={S.dim} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paid Pilot</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Pricing card */}
        <View style={styles.priceCard}>
          <View style={styles.priceBadge}>
            <View style={styles.priceBadgeDot} />
            <Text style={styles.priceBadgeText}>FOUNDING MERCHANT</Text>
          </View>
          <Text style={styles.priceProduct}>{STARTER_PACK.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{formatMoney(STARTER_PACK.priceCents)}</Text>
            <Text style={styles.priceUnit}>one-time</Text>
          </View>
          <Text style={styles.priceCaption}>Everything you need to launch your restaurant on CraveMap.</Text>

          <View style={styles.divider} />

          {STARTER_PACK.bullets.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <View style={styles.checkWrap}>
                <Ionicons name="checkmark" size={12} color={S.green} />
              </View>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>

        {/* Success state */}
        {recorded && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={18} color={S.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>
                Payment recorded — {formatMoney(recorded.amount)}
              </Text>
              <Text style={styles.successBody}>
                {recorded.provider === 'stripe'
                  ? 'Stripe payment logged in CraveMap. Stripe Dashboard remains the upstream record.'
                  : 'Manual payment logged for evidence. Visible in Revenue Dashboard.'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/studio/revenue')} activeOpacity={0.85}>
                <Text style={styles.successLink}>View Revenue Dashboard →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Error */}
        {error.length > 0 && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Primary CTA — depends on env */}
        {hasPaymentLink ? (
          <>
            <TouchableOpacity
              style={[styles.primaryCta, busy === 'stripe' && styles.ctaBusy]}
              onPress={openStripeLink}
              activeOpacity={0.85}
              disabled={busy !== null}
            >
              {busy === 'stripe' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text style={styles.primaryCtaText}>
                    Pay {formatMoney(STARTER_PACK.priceCents)} with Stripe
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.ctaCaption}>
              Opens Stripe Payment Link. Return here after paying to record the payment.
            </Text>

            <TouchableOpacity
              style={[styles.secondaryCta, busy !== null && styles.ctaBusy]}
              onPress={recordStripeReturn}
              activeOpacity={0.85}
              disabled={busy !== null}
            >
              <Ionicons name="checkmark-done-outline" size={16} color={S.blue} />
              <Text style={styles.secondaryCtaText}>I've completed Stripe payment — record it</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.primaryCta} onPress={openContact} activeOpacity={0.85}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={styles.primaryCtaText}>Contact us to start paid pilot</Text>
            </TouchableOpacity>
            <Text style={styles.ctaCaption}>
              Email {SUPPORT_EMAIL}. We'll send a Stripe Payment Link.
            </Text>
          </>
        )}

        {/* Dev-only manual record button */}
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.devCta, busy !== null && styles.ctaBusy]}
            onPress={recordManual}
            activeOpacity={0.85}
            disabled={busy !== null}
          >
            {busy === 'manual' ? (
              <ActivityIndicator color={S.amber} size="small" />
            ) : (
              <>
                <Ionicons name="bug-outline" size={14} color={S.amber} />
                <Text style={styles.devCtaText}>
                  Dev: record manual payment ({formatMoney(STARTER_PACK.priceCents)})
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.footnote}>
          <Ionicons name="lock-closed-outline" size={12} color={S.dim} />
          <Text style={styles.footnoteText}>
            We never store card numbers or sensitive payment data. Only amount, currency, and (for Stripe) the checkout session ID.
          </Text>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.dark },
  blob1: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#3A3AFF18',
  },
  blob2: {
    position: 'absolute', bottom: 60, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.primary + '12',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: S.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: S.border,
  },
  headerTitle: { ...Typography.h3, color: '#FFFFFF', fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  blockedTitle: { ...Typography.h2, color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  blockedBody: { ...Typography.body, color: S.dim, textAlign: 'center', lineHeight: 22 },

  // Price card
  priceCard: {
    backgroundColor: S.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: S.blue + '60',
    marginBottom: Spacing.lg,
    shadowColor: S.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  priceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#14142E', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 4,
    borderWidth: 1, borderColor: S.border,
    marginBottom: Spacing.md,
  },
  priceBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: S.green },
  priceBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#8888FF' },
  priceProduct: { ...Typography.h2, color: '#FFFFFF', fontWeight: '800', marginBottom: Spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  priceAmount: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', lineHeight: 44 },
  priceUnit: { ...Typography.caption, color: S.dim },
  priceCaption: { ...Typography.body, color: S.dim, lineHeight: 22, marginBottom: Spacing.sm },
  divider: {
    height: 1, backgroundColor: S.border,
    marginVertical: Spacing.md,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  checkWrap: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: S.green + '25',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  bulletText: { ...Typography.body, color: '#FFFFFF', flex: 1, lineHeight: 22 },

  // Success
  successCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: '#1A2A1A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: '#2A4A2A',
    marginBottom: Spacing.md,
  },
  successTitle: { ...Typography.label, color: '#88CC88', fontWeight: '700', marginBottom: 2 },
  successBody: { ...Typography.caption, color: '#669966', lineHeight: 18, marginBottom: 4 },
  successLink: { ...Typography.caption, color: S.green, fontWeight: '700' },

  // Error
  errorCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: '#3A1A1A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: '#5A2A2A',
    marginBottom: Spacing.md,
  },
  errorText: { ...Typography.caption, color: '#FFAAAA', flex: 1, lineHeight: 18 },

  // Primary
  primaryCta: {
    backgroundColor: S.blue, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    shadowColor: S.blue, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  primaryCtaText: { ...Typography.h3, color: '#fff' },
  ctaBusy: { opacity: 0.7 },
  ctaCaption: { ...Typography.caption, color: S.dim, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 18 },

  // Secondary
  secondaryCta: {
    backgroundColor: S.card, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs + 2, marginTop: Spacing.md,
    borderWidth: 1.5, borderColor: S.blue + '50',
  },
  secondaryCtaText: { ...Typography.label, color: S.blue, fontWeight: '700' },

  // Dev
  devCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md,
    backgroundColor: '#2A2010', borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: '#4A3520', marginTop: Spacing.lg,
  },
  devCtaText: { ...Typography.caption, color: S.amber, fontWeight: '700' },

  // Footnote
  footnote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: Spacing.lg,
  },
  footnoteText: { ...Typography.caption, color: S.dim, flex: 1, lineHeight: 17 },
});
