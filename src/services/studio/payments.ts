// ============================================================================
// CraveMap Studio — Payment evidence service
// ============================================================================
// Lightweight payments layer for the hackathon revenue-evidence flow.
//
// Two write paths land in merchant_payments:
//   1. recordManualPayment()  — used by Upgrade screen ("Record manual payment")
//   2. recordStripePayment()  — used by Upgrade screen after a Stripe Payment
//                                Link redirect, to mirror the upstream payment
//                                into our DB for in-app evidence.
//
// Client reports always remain pending. Only a trusted server verification
// may set succeeded + verified_at; reports never establish paid revenue.
// ============================================================================

import { summarizeVerifiedRevenue } from './revenuePolicy';
import { getSupabaseClient } from '../../lib/supabase';
import { getMerchantForUser } from './runMenuAnalysis';

// ── Product constants ─────────────────────────────────────────────────────────

export const STARTER_PACK = {
  name: 'AI Restaurant Growth Starter Pack',
  priceCents: 4900,
  currency: 'USD',
  bullets: [
    'AI menu analysis',
    '7-day campaign calendar',
    '3 short video scripts',
    '5 dish recommendation cards',
    '1 customer insight summary',
  ],
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MerchantPayment {
  id: string;
  amountCents: number;
  currency: string;
  paymentProvider: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'canceled';
  productName: string | null;
  externalPaymentId: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface RevenueSummary {
  /** Sum of verified succeeded USD payments; other currencies stay itemized. */
  totalCents: number;
  /** Count of verified succeeded payments in the summary currency. */
  succeededCount: number;
  /** Summary currency, fixed to USD. */
  currency: string;
  /** All payments, newest first. */
  payments: MerchantPayment[];
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

interface PaymentRow {
  id: string;
  amount_cents: number;
  currency: string;
  payment_provider: string;
  payment_status: string;
  product_name: string | null;
  external_payment_id: string | null;
  created_at: string;
  verified_at: string | null;
}

function mapRow(row: PaymentRow): MerchantPayment {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    currency: row.currency,
    paymentProvider: row.payment_provider,
    paymentStatus: row.payment_status as MerchantPayment['paymentStatus'],
    productName: row.product_name,
    externalPaymentId: row.external_payment_id,
    createdAt: row.created_at,
    verifiedAt: row.verified_at ?? null,
  };
}

// ── Read ──────────────────────────────────────────────────────────────────────

/** Returns the signed-in merchant's payments, newest first. Empty if no merchant profile. */
export async function getMerchantPayments(userId: string): Promise<MerchantPayment[]> {
  const client = requireClient();
  const merchant = await getMerchantForUser(userId);
  if (!merchant) return [];

  const { data, error } = await client
    .from('merchant_payments')
    .select(
      'id, amount_cents, currency, payment_provider, payment_status, product_name, external_payment_id, created_at, verified_at',
    )
    .eq('merchant_id', merchant.merchantId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as PaymentRow));
}

/** Aggregates the signed-in merchant's payments for the Revenue Dashboard. */
export async function getRevenueSummary(userId: string): Promise<RevenueSummary> {
  const payments = await getMerchantPayments(userId);
  return { ...summarizeVerifiedRevenue(payments), payments };
}

// ── Write ─────────────────────────────────────────────────────────────────────

export interface RecordPaymentOptions {
  amountCents?: number;
  productName?: string;
  currency?: string;
}

async function insertPayment(
  userId: string,
  provider: 'manual' | 'stripe',
  opts: RecordPaymentOptions & { externalPaymentId?: string | null },
): Promise<MerchantPayment> {
  const client = requireClient();
  const merchant = await getMerchantForUser(userId);
  if (!merchant) {
    throw new Error('No merchant profile found. Please complete Studio onboarding first.');
  }

  const { data, error } = await client
    .from('merchant_payments')
    .insert({
      merchant_id: merchant.merchantId,
      amount_cents: opts.amountCents ?? STARTER_PACK.priceCents,
      currency: opts.currency ?? STARTER_PACK.currency,
      payment_provider: provider,
      payment_status: 'pending',
      product_name: opts.productName ?? STARTER_PACK.name,
      external_payment_id: opts.externalPaymentId ?? null,
    })
    .select(
      'id, amount_cents, currency, payment_provider, payment_status, product_name, external_payment_id, created_at, verified_at',
    )
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Payment could not be recorded.');
  return mapRow(data as PaymentRow);
}

/**
 * Insert a manual payment record. Used by the in-app "Record manual payment"
 * button — for hackathon evidence without standing up Stripe webhooks.
 */
export async function recordManualPayment(
  userId: string,
  opts: RecordPaymentOptions = {},
): Promise<MerchantPayment> {
  return insertPayment(userId, 'manual', opts);
}

/**
 * Insert a Stripe payment record after the merchant returns from the
 * Stripe Payment Link. We don't verify against Stripe — this is merchant-
 * reported in-app evidence; Stripe Dashboard remains the upstream truth.
 */
export async function recordStripePayment(
  userId: string,
  opts: RecordPaymentOptions & { sessionId?: string } = {},
): Promise<MerchantPayment> {
  return insertPayment(userId, 'stripe', {
    ...opts,
    externalPaymentId: opts.sessionId ?? null,
  });
}

// ── Display helpers ───────────────────────────────────────────────────────────

export function formatMoney(cents: number, currency = 'USD'): string {
  const amount = cents / 100;
  // Whole dollars get no fractional digits for cleaner pricing cards.
  const isWhole = amount === Math.floor(amount);
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  })}${currency === 'USD' ? '' : ` ${currency}`}`;
}
