import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
  getRevenueSummary,
  type MerchantPayment,
  type RevenueSummary,
} from '../../src/services/studio/payments';

const S = {
  blue: '#3A3AFF',
  dark: '#0E0E2A',
  card: '#1E1E40',
  border: '#3A3AFF30',
  dim: '#A0A0C8',
  green: '#44CC88',
  amber: '#FFB800',
  red: '#FF5A8A',
};

type Stage = 'loading' | 'loaded' | 'empty' | 'error';

export default function StudioRevenue() {
  const router = useRouter();
  const { session } = useAuth();
  const gate = useStudioAuthGate();

  const [stage, setStage] = useState<Stage>('loading');
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setStage('empty');
      return;
    }
    try {
      const result = await getRevenueSummary(session.userId);
      setSummary(result);
      setStage(result.payments.length === 0 ? 'empty' : 'loaded');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load revenue.');
      setStage('error');
    }
  }, [session]);

  useEffect(() => {
    if (gate.ready) load();
  }, [gate.ready, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
                Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env.
              </Text>
            </>
          ) : (
            <ActivityIndicator color={S.blue} size="large" />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={S.dim} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue Dashboard</Text>
        <View style={{ width: 36 }} />
      </View>

      {stage === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={S.blue} size="large" />
        </View>
      )}

      {stage === 'error' && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.blockedTitle}>Couldn't load revenue</Text>
          <Text style={styles.blockedBody}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {(stage === 'loaded' || stage === 'empty') && (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={S.blue}
            />
          }
        >
          {/* Stats — screenshot target */}
          <View style={styles.statsRow}>
            <StatCard
              icon="💰"
              label="Total revenue"
              value={summary ? formatMoney(summary.totalCents, summary.currency) : '$0'}
              accent={S.green}
            />
            <StatCard
              icon="✅"
              label="Successful payments"
              value={String(summary?.succeededCount ?? 0)}
              accent={S.blue}
            />
          </View>

          {/* Note about scope */}
          <View style={styles.scopeNote}>
            <Ionicons name="information-circle-outline" size={14} color={S.dim} />
            <Text style={styles.scopeNoteText}>
              Showing your merchant's payments. Platform-wide totals require admin access.
            </Text>
          </View>

          {/* Latest payments */}
          <Text style={styles.sectionLabel}>LATEST PAYMENTS</Text>

          {stage === 'empty' && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🧾</Text>
              <Text style={styles.emptyTitle}>No payments yet</Text>
              <Text style={styles.emptyBody}>
                Once you start a paid pilot, payments will appear here as evidence.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => router.push('/studio/upgrade')}
                activeOpacity={0.85}
              >
                <Ionicons name="rocket-outline" size={16} color="#fff" />
                <Text style={styles.emptyCtaText}>Start paid pilot</Text>
              </TouchableOpacity>
            </View>
          )}

          {stage === 'loaded' && summary && (
            <View style={{ gap: Spacing.sm }}>
              {summary.payments.map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </View>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: accent + '50' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PaymentRow({ payment }: { payment: MerchantPayment }) {
  const statusColor =
    payment.paymentStatus === 'succeeded'
      ? S.green
      : payment.paymentStatus === 'failed' || payment.paymentStatus === 'canceled'
        ? S.red
        : S.amber;
  const date = new Date(payment.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentLeft}>
        <Text style={styles.paymentProduct} numberOfLines={1}>
          {payment.productName ?? 'Payment'}
        </Text>
        <View style={styles.paymentMeta}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.paymentStatus}>{payment.paymentStatus}</Text>
          <Text style={styles.paymentSep}>·</Text>
          <Text style={styles.paymentProvider}>{payment.paymentProvider}</Text>
          <Text style={styles.paymentSep}>·</Text>
          <Text style={styles.paymentDate}>{date}</Text>
        </View>
      </View>
      <Text style={styles.paymentAmount}>
        {formatMoney(payment.amountCents, payment.currency)}
      </Text>
    </View>
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
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  blockedTitle: { ...Typography.h2, color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  blockedBody: { ...Typography.body, color: S.dim, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: S.blue, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  retryBtnText: { ...Typography.label, color: '#fff', fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: S.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    alignItems: 'flex-start',
    gap: 4,
  },
  statIcon: { fontSize: 24, marginBottom: 2 },
  statValue: { ...Typography.h1, fontSize: 28, color: '#FFFFFF', fontWeight: '800' },
  statLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: S.dim, textTransform: 'uppercase',
  },

  // Scope note
  scopeNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#14142E',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: S.border,
    marginBottom: Spacing.lg,
  },
  scopeNoteText: { ...Typography.caption, color: S.dim, flex: 1, lineHeight: 17 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    color: '#6666AA', marginBottom: Spacing.sm,
  },

  // Empty
  emptyCard: {
    backgroundColor: S.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1, borderColor: S.border,
    alignItems: 'center', gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { ...Typography.h3, color: '#FFFFFF', fontWeight: '700' },
  emptyBody: { ...Typography.caption, color: S.dim, textAlign: 'center', lineHeight: 18 },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: S.blue, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  emptyCtaText: { ...Typography.label, color: '#fff', fontWeight: '700' },

  // Payment row
  paymentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: S.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: S.border,
  },
  paymentLeft: { flex: 1, gap: 4 },
  paymentProduct: { ...Typography.label, color: '#FFFFFF', fontWeight: '700' },
  paymentMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  paymentStatus: {
    fontSize: 10, fontWeight: '700', color: '#FFFFFF',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  paymentSep: { fontSize: 10, color: S.dim },
  paymentProvider: { fontSize: 10, color: S.dim, fontWeight: '600', textTransform: 'uppercase' },
  paymentDate: { fontSize: 10, color: S.dim },
  paymentAmount: { ...Typography.h3, color: '#FFFFFF', fontWeight: '800' },
});
