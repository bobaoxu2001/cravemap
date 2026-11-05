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
import { useStudioAuthGate } from '../../src/hooks/useStudioAuthGate';
import {
  fetchStudioEvidence,
  type StudioEvidence,
  type StudioAgentLog,
  type StudioMerchantSnapshot,
  type StudioCampaignSnapshot,
} from '../../src/services/studio/evidence';
import { formatMoney } from '../../src/services/studio/payments';

const S = {
  blue: '#3A3AFF',
  dark: '#0E0E2A',
  card: '#1E1E40',
  border: '#3A3AFF30',
  dim: '#A0A0C8',
  green: '#44CC88',
  amber: '#FFB800',
  red: '#FF5A8A',
  purple: '#A988FF',
};

type Stage = 'loading' | 'loaded' | 'error';

const HERO_NOTE =
  "This dashboard shows CraveMap Studio's AI agents analyzing menus, generating campaigns, and producing restaurant growth insights.";

export default function StudioEvidence() {
  const router = useRouter();
  const gate = useStudioAuthGate();

  const [stage, setStage] = useState<Stage>('loading');
  const [evidence, setEvidence] = useState<StudioEvidence | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await fetchStudioEvidence();
      setEvidence(result);
      setStage('loaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load evidence.');
      setStage('error');
    }
  }, []);

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
        <Text style={styles.headerTitle}>Evidence Dashboard</Text>
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
          <Text style={styles.blockedTitle}>Couldn't load evidence</Text>
          <Text style={styles.blockedBody}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {stage === 'loaded' && evidence && (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={S.blue} />
          }
        >
          {/* Hero note */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>AI-OPERATED · LIVE</Text>
            </View>
            <Text style={styles.heroNote}>{HERO_NOTE}</Text>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="🤖"
              value={String(evidence.totals.agentRuns)}
              label="AI agent runs"
              accent={S.blue}
            />
            <StatCard
              icon="🧠"
              value={String(evidence.totals.menuAnalysisRuns)}
              label="Menu analyses"
              accent={S.purple}
            />
            <StatCard
              icon="📣"
              value={String(evidence.totals.campaignRuns)}
              label="Campaigns generated"
              accent={S.amber}
            />
            <StatCard
              icon="✅"
              value={`${Math.round(evidence.totals.successRate * 100)}%`}
              label="Success rate"
              accent={S.green}
              sub={`${evidence.totals.successRuns} / ${evidence.totals.agentRuns} succeeded`}
            />
          </View>

          {/* Revenue */}
          {evidence.revenue.succeededCount > 0 && (
            <View style={styles.revenueCard}>
              <View style={styles.revenueLeft}>
                <Text style={styles.revenueLabel}>REVENUE EVIDENCE</Text>
                <Text style={styles.revenueAmount}>
                  {formatMoney(evidence.revenue.totalCents, evidence.revenue.currency)}
                </Text>
              </View>
              <View style={styles.revenueRight}>
                <RevenueStat label="Payments" value={String(evidence.revenue.succeededCount)} />
                <RevenueStat label="Paid merchants" value={String(evidence.revenue.paidMerchants)} />
              </View>
            </View>
          )}

          {/* Latest agent logs */}
          <SectionTitle icon="🤖" title="Latest AI agent runs" count={evidence.latestAgentLogs.length} />
          {evidence.latestAgentLogs.length === 0 ? (
            <EmptyHint text="No agent runs yet. Run an analysis or campaign to populate." />
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {evidence.latestAgentLogs.map((log, i) => (
                <AgentLogRow key={i} log={log} />
              ))}
            </View>
          )}

          {/* Latest merchants */}
          <SectionTitle
            icon="🏪"
            title="Latest merchants onboarded"
            count={evidence.latestMerchants.length}
          />
          {evidence.latestMerchants.length === 0 ? (
            <EmptyHint text="No merchants yet. Complete Studio onboarding to populate." />
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {evidence.latestMerchants.map((m, i) => (
                <MerchantRow key={i} merchant={m} />
              ))}
            </View>
          )}

          {/* Latest campaigns */}
          <SectionTitle
            icon="📣"
            title="Latest campaigns generated"
            count={evidence.latestCampaigns.length}
          />
          {evidence.latestCampaigns.length === 0 ? (
            <EmptyHint text="No campaigns yet. Generate one to populate." />
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {evidence.latestCampaigns.map((c, i) => (
                <CampaignRow key={i} campaign={c} />
              ))}
            </View>
          )}

          {/* Footnote */}
          <View style={styles.footnote}>
            <Ionicons name="shield-checkmark-outline" size={12} color={S.dim} />
            <Text style={styles.footnoteText}>
              Owner emails, phone numbers, and AI prompt/response bodies are never exposed here. Lists capped at 10 rows.
            </Text>
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  accent,
  sub,
}: {
  icon: string;
  value: string;
  label: string;
  accent: string;
  sub?: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: accent + '50' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function RevenueStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.revenueStat}>
      <Text style={styles.revenueStatValue}>{value}</Text>
      <Text style={styles.revenueStatLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({
  icon,
  title,
  count,
}: {
  icon: string;
  title: string;
  count: number;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && (
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function AgentLogRow({ log }: { log: StudioAgentLog }) {
  const statusColor =
    log.status === 'success' ? S.green : log.status === 'failed' ? S.red : S.amber;
  const date = formatTime(log.createdAt);
  const agentLabel = log.agentName === 'menu-analyzer'
    ? 'Menu Analyzer'
    : log.agentName === 'campaign-generator'
      ? 'Campaign Generator'
      : log.agentName;
  return (
    <View style={styles.logCard}>
      <View style={styles.logTopRow}>
        <Text style={styles.logAgent}>{agentLabel}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '25', borderColor: statusColor + '60' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{log.status}</Text>
        </View>
      </View>
      <View style={styles.logMeta}>
        {log.modelUsed && (
          <>
            <Text style={styles.logMetaText}>{log.modelUsed}</Text>
            <Text style={styles.logSep}>·</Text>
          </>
        )}
        {log.latencyMs != null && (
          <>
            <Text style={styles.logMetaText}>{log.latencyMs}ms</Text>
            <Text style={styles.logSep}>·</Text>
          </>
        )}
        <Text style={styles.logMetaText}>{date}</Text>
      </View>
    </View>
  );
}

function MerchantRow({ merchant }: { merchant: StudioMerchantSnapshot }) {
  return (
    <View style={styles.merchantCard}>
      <View style={styles.merchantIconWrap}>
        <Text style={styles.merchantIcon}>🍜</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.merchantName} numberOfLines={1}>
          {merchant.restaurantName}
        </Text>
        <View style={styles.merchantMeta}>
          {merchant.cuisineType && (
            <>
              <Text style={styles.merchantMetaText}>{merchant.cuisineType}</Text>
              <Text style={styles.logSep}>·</Text>
            </>
          )}
          {merchant.city && (
            <>
              <Text style={styles.merchantMetaText}>{merchant.city}</Text>
              <Text style={styles.logSep}>·</Text>
            </>
          )}
          <Text style={styles.merchantMetaText}>{formatTime(merchant.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}

function CampaignRow({ campaign }: { campaign: StudioCampaignSnapshot }) {
  return (
    <View style={styles.campaignCard}>
      <View style={styles.campaignTitleRow}>
        <Ionicons name="megaphone-outline" size={14} color={S.amber} />
        <Text style={styles.campaignTitle} numberOfLines={2}>
          {campaign.campaignTitle}
        </Text>
      </View>
      {campaign.campaignGoal && (
        <Text style={styles.campaignGoal} numberOfLines={2}>{campaign.campaignGoal}</Text>
      )}
      <Text style={styles.campaignDate}>{formatTime(campaign.createdAt)}</Text>
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <View style={styles.emptyHint}>
      <Text style={styles.emptyHintText}>{text}</Text>
    </View>
  );
}

function formatTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
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

  // Hero
  heroCard: {
    backgroundColor: S.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1, borderColor: S.blue + '50',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#0A1A0A',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2A4A2A',
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: S.green },
  heroBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#88CC88' },
  heroNote: {
    ...Typography.body,
    color: '#FFFFFF',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Stats grid (2x2)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    width: '48%',
    minWidth: 140,
    backgroundColor: S.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    gap: 2,
  },
  statIcon: { fontSize: 22, marginBottom: 2 },
  statValue: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  statLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: S.dim, textTransform: 'uppercase',
    marginTop: 2,
  },
  statSub: { ...Typography.caption, color: S.dim, marginTop: 4, fontSize: 10 },

  // Revenue
  revenueCard: {
    flexDirection: 'row',
    backgroundColor: S.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1, borderColor: S.green + '50',
    marginBottom: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  revenueLeft: { flex: 1 },
  revenueLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    color: '#88CC88', marginBottom: 4,
  },
  revenueAmount: {
    fontSize: 32, fontWeight: '800', color: '#FFFFFF', lineHeight: 36,
  },
  revenueRight: { flexDirection: 'row', gap: Spacing.md },
  revenueStat: { alignItems: 'flex-end' },
  revenueStatValue: { ...Typography.h3, color: '#FFFFFF', fontWeight: '800' },
  revenueStatLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1, color: S.dim,
    textTransform: 'uppercase', marginTop: 2,
  },

  // Section
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { ...Typography.h3, color: '#FFFFFF', fontWeight: '700', flex: 1 },
  countPill: {
    backgroundColor: '#14142E',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1, borderColor: S.border,
  },
  countPillText: { fontSize: 11, color: S.dim, fontWeight: '700' },

  // Log row
  logCard: {
    backgroundColor: S.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: S.border,
    gap: 6,
  },
  logTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logAgent: { ...Typography.label, color: '#FFFFFF', fontWeight: '700' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  logMetaText: { fontSize: 10, color: S.dim, fontWeight: '600' },
  logSep: { fontSize: 10, color: S.dim },

  // Merchant row
  merchantCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: S.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: S.border,
  },
  merchantIconWrap: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: '#14142E',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  merchantIcon: { fontSize: 18 },
  merchantName: { ...Typography.label, color: '#FFFFFF', fontWeight: '700', marginBottom: 2 },
  merchantMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  merchantMetaText: { fontSize: 10, color: S.dim, fontWeight: '600' },

  // Campaign row
  campaignCard: {
    backgroundColor: S.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: S.border,
    gap: 4,
  },
  campaignTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  campaignTitle: { ...Typography.label, color: '#FFFFFF', fontWeight: '700', flex: 1, lineHeight: 20 },
  campaignGoal: { ...Typography.caption, color: S.dim, lineHeight: 17 },
  campaignDate: { fontSize: 10, color: S.dim, fontWeight: '600', marginTop: 2 },

  // Empty
  emptyHint: {
    backgroundColor: '#14142E',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: S.border,
  },
  emptyHintText: { ...Typography.caption, color: S.dim, fontStyle: 'italic', lineHeight: 17 },

  // Footnote
  footnote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: Spacing.xl,
  },
  footnoteText: { ...Typography.caption, color: S.dim, flex: 1, lineHeight: 17, fontSize: 11 },
});
