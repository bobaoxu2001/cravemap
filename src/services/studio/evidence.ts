// ============================================================================
// CraveMap Studio — Evidence service
// ============================================================================
// Thin client wrapper for the Studio Evidence Dashboard.
//
// Calls the `get_studio_evidence()` Postgres function (migration 006), which
// returns a single jsonb blob of safe aggregates + recent rows across all
// merchants. The function strips PII server-side; this module just shapes
// the response into typed records.
//
// As a defense-in-depth measure, this module also exposes `maskEmail()` /
// `maskPhone()` — call them anywhere raw PII might leak into a display
// component. The current RPC never returns email/phone, so they're unused
// by the Evidence screen but available for future expansion.
// ============================================================================

import { getSupabaseClient } from '../../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StudioEvidenceTotals {
  agentRuns: number;
  menuAnalysisRuns: number;
  campaignRuns: number;
  successRuns: number;
  failedRuns: number;
  /** 0–1; 1 = 100% success. Returns 1 when agentRuns === 0 (no failures yet). */
  successRate: number;
}

export interface StudioAgentLog {
  agentName: string;
  actionType: string;
  status: string;
  modelUsed: string | null;
  provider: string | null;
  latencyMs: number | null;
  createdAt: string;
}

export interface StudioMerchantSnapshot {
  restaurantName: string;
  city: string | null;
  cuisineType: string | null;
  createdAt: string;
}

export interface StudioCampaignSnapshot {
  campaignTitle: string;
  campaignGoal: string | null;
  createdAt: string;
}

export interface StudioRevenueSnapshot {
  totalCents: number;
  succeededCount: number;
  paidMerchants: number;
  currency: string;
}

export interface StudioEvidence {
  totals: StudioEvidenceTotals;
  latestAgentLogs: StudioAgentLog[];
  latestMerchants: StudioMerchantSnapshot[];
  latestCampaigns: StudioCampaignSnapshot[];
  revenue: StudioRevenueSnapshot;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return client;
}

interface RawTotals {
  agent_runs?: number;
  menu_analysis_runs?: number;
  campaign_runs?: number;
  success_runs?: number;
  failed_runs?: number;
}

interface RawLog {
  agent_name?: string;
  action_type?: string;
  status?: string;
  model_used?: string | null;
  provider?: string | null;
  latency_ms?: number | null;
  created_at?: string;
}

interface RawMerchant {
  restaurant_name?: string;
  city?: string | null;
  cuisine_type?: string | null;
  created_at?: string;
}

interface RawCampaign {
  campaign_title?: string;
  campaign_goal?: string | null;
  created_at?: string;
}

interface RawRevenue {
  total_cents?: number;
  succeeded_count?: number;
  paid_merchants?: number;
  currency?: string;
}

interface RawEvidence {
  totals?: RawTotals;
  latest_agent_logs?: RawLog[];
  latest_merchants?: RawMerchant[];
  latest_campaigns?: RawCampaign[];
  revenue?: RawRevenue;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fetch platform-wide evidence aggregates. Requires an authenticated session
 * (the RPC is granted to `authenticated`, not `anon`).
 */
export async function fetchStudioEvidence(): Promise<StudioEvidence> {
  const client = requireClient();
  const { data, error } = await client.rpc('get_studio_evidence');
  if (error) throw new Error(error.message);

  const raw = (data ?? {}) as RawEvidence;
  const t = raw.totals ?? {};

  const agentRuns = t.agent_runs ?? 0;
  const successRuns = t.success_runs ?? 0;
  const successRate = agentRuns === 0 ? 1 : successRuns / agentRuns;

  return {
    totals: {
      agentRuns,
      menuAnalysisRuns: t.menu_analysis_runs ?? 0,
      campaignRuns: t.campaign_runs ?? 0,
      successRuns,
      failedRuns: t.failed_runs ?? 0,
      successRate,
    },
    latestAgentLogs: (raw.latest_agent_logs ?? []).map((r) => ({
      agentName: r.agent_name ?? 'unknown',
      actionType: r.action_type ?? '',
      status: r.status ?? 'unknown',
      modelUsed: r.model_used ?? null,
      provider: r.provider ?? null,
      latencyMs: r.latency_ms ?? null,
      createdAt: r.created_at ?? '',
    })),
    latestMerchants: (raw.latest_merchants ?? []).map((r) => ({
      restaurantName: r.restaurant_name ?? 'Unknown',
      city: r.city ?? null,
      cuisineType: r.cuisine_type ?? null,
      createdAt: r.created_at ?? '',
    })),
    latestCampaigns: (raw.latest_campaigns ?? []).map((r) => ({
      campaignTitle: r.campaign_title ?? 'Untitled',
      campaignGoal: r.campaign_goal ?? null,
      createdAt: r.created_at ?? '',
    })),
    revenue: {
      totalCents: raw.revenue?.total_cents ?? 0,
      succeededCount: raw.revenue?.succeeded_count ?? 0,
      paidMerchants: raw.revenue?.paid_merchants ?? 0,
      currency: raw.revenue?.currency ?? 'USD',
    },
  };
}

// ── PII masking helpers (defense in depth) ────────────────────────────────────

/**
 * "first.last@domain.com" → "f••••t@domain.com". Returns the input unchanged
 * if it doesn't look like an email.
 */
export function maskEmail(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  const at = raw.indexOf('@');
  if (at < 1) return raw;
  const local = raw.slice(0, at);
  const domain = raw.slice(at);
  if (local.length <= 2) return `${local[0] ?? ''}•${domain}`;
  return `${local[0]}${'•'.repeat(Math.min(4, local.length - 2))}${local[local.length - 1]}${domain}`;
}

/**
 * "+1 415 555 1234" → "+1 ••• ••• 1234". Keeps the last 4 digits.
 * Returns "—" if input has no digits.
 */
export function maskPhone(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '—';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return '—';
  const last4 = digits.slice(-4);
  return `••• ••• ${last4}`;
}
