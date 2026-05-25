// ============================================================================
// CraveMap Studio — Menu Analysis orchestrator
// ============================================================================
// Wraps the Gemini menuAnalysis call with persistence:
//   1. Fetch latest merchant + menu source for the signed-in user
//   2. Run Gemini (or return mock output if no API key is configured)
//   3. Insert ai_menu_analyses row
//   4. Mark restaurant_menu_sources status as processed / failed
//   5. Insert ai_agent_logs row (success or failure)
// ============================================================================

import { getSupabaseClient } from '../../lib/supabase';
import {
  analyzeRestaurantMenu,
  EXAMPLE_MENU_ANALYSIS_OUTPUT,
  type MenuAnalysisInput,
  type MenuAnalysisOutput,
} from './menuAnalysis';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MerchantSnapshot {
  merchantId: string;
  restaurantName: string;
  city: string | null;
  cuisineType: string | null;
}

export interface StoredAnalysis {
  id: string;
  merchantId: string;
  data: MenuAnalysisOutput;
  createdAt: string;
  modelUsed: string;
  isDemo: boolean;
}

export class StudioNotOnboardedError extends Error {
  constructor() {
    super('No merchant profile found. Please complete onboarding first.');
    this.name = 'StudioNotOnboardedError';
  }
}

export class StudioNoMenuSourceError extends Error {
  constructor() {
    super('No menu content found. Please submit your menu via onboarding.');
    this.name = 'StudioNoMenuSourceError';
  }
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

function hasGeminiKey(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
}

/** Returns the merchant profile for the signed-in user, or null. */
export async function getMerchantForUser(userId: string): Promise<MerchantSnapshot | null> {
  const client = requireClient();
  const { data, error } = await client
    .from('merchant_profiles')
    .select('id, restaurant_name, city, cuisine_type')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    merchantId: data.id as string,
    restaurantName: data.restaurant_name as string,
    city: (data.city as string | null) ?? null,
    cuisineType: (data.cuisine_type as string | null) ?? null,
  };
}

/** Returns the most recent menu source row for a merchant, or null. */
async function getLatestMenuSource(merchantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('restaurant_menu_sources')
    .select('id, raw_menu_text, status, created_at')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as { id: string; raw_menu_text: string | null; status: string; created_at: string } | null;
}

/** Returns the most recent analysis for a merchant, or null. */
export async function getLatestMenuAnalysis(userId: string): Promise<StoredAnalysis | null> {
  const merchant = await getMerchantForUser(userId);
  if (!merchant) return null;

  const client = requireClient();
  const { data, error } = await client
    .from('ai_menu_analyses')
    .select(
      'id, merchant_id, created_at, summary, top_dishes, customer_personas, taste_tags, pricing_insights, health_positioning, content_angles, risks, raw_ai_output',
    )
    .eq('merchant_id', merchant.merchantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const rawOutput = (data.raw_ai_output ?? {}) as { model_used?: string; is_demo?: boolean };

  return {
    id: data.id as string,
    merchantId: data.merchant_id as string,
    createdAt: data.created_at as string,
    modelUsed: rawOutput.model_used ?? 'unknown',
    isDemo: Boolean(rawOutput.is_demo),
    data: {
      summary: (data.summary as string) ?? '',
      top_dishes: (data.top_dishes ?? []) as MenuAnalysisOutput['top_dishes'],
      customer_personas: (data.customer_personas ?? []) as MenuAnalysisOutput['customer_personas'],
      taste_tags: (data.taste_tags ?? []) as string[],
      pricing_insights: (data.pricing_insights ?? {
        tier: '$$',
        positioning: '',
        opportunities: [],
      }) as MenuAnalysisOutput['pricing_insights'],
      health_positioning: (data.health_positioning ?? {
        highlights: [],
        dietaryOptions: [],
        marketingClaims: [],
      }) as MenuAnalysisOutput['health_positioning'],
      content_angles: (data.content_angles ?? []) as MenuAnalysisOutput['content_angles'],
      risks: (data.risks ?? []) as MenuAnalysisOutput['risks'],
    },
  };
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function runMenuAnalysis(userId: string): Promise<StoredAnalysis> {
  const client = requireClient();

  const merchant = await getMerchantForUser(userId);
  if (!merchant) throw new StudioNotOnboardedError();

  const menuSource = await getLatestMenuSource(merchant.merchantId);
  if (!menuSource || !menuSource.raw_menu_text?.trim()) {
    throw new StudioNoMenuSourceError();
  }

  const input: MenuAnalysisInput = {
    restaurantName: merchant.restaurantName,
    menuText: menuSource.raw_menu_text,
    cuisineType: merchant.cuisineType ?? undefined,
    city: merchant.city ?? undefined,
  };

  const isDemo = !hasGeminiKey();
  const startedAt = Date.now();

  let analysisData: MenuAnalysisOutput;
  let modelUsed: string;
  let provider: string;
  let latencyMs: number;
  let agentStatus: 'success' | 'failed' = 'success';
  let agentError: string | null = null;

  if (isDemo) {
    // Demo mode — no API key configured. Use the canned example output so
    // the flow can be exercised end-to-end during development.
    await new Promise((r) => setTimeout(r, 900));
    analysisData = EXAMPLE_MENU_ANALYSIS_OUTPUT;
    modelUsed = 'demo-mock';
    provider = 'demo';
    latencyMs = Date.now() - startedAt;
  } else {
    try {
      const result = await analyzeRestaurantMenu(input);
      analysisData = result.data;
      modelUsed = result.model_used;
      provider = result.provider;
      latencyMs = result.latency_ms;
    } catch (err) {
      agentStatus = 'failed';
      agentError = err instanceof Error ? err.message : String(err);
      latencyMs = Date.now() - startedAt;

      // Log the failure so it appears in agent logs, then rethrow for the UI.
      await logAgentRun(client, {
        merchantId: merchant.merchantId,
        agentName: 'menu-analyzer',
        actionType: 'analyze_menu',
        input,
        output: null,
        modelUsed: 'gemini-2.0-flash',
        provider: 'google',
        status: agentStatus,
        errorMessage: agentError,
        latencyMs,
      });
      await markMenuSourceStatus(client, menuSource.id, 'failed');
      throw err;
    }
  }

  // ── Persist analysis row ────────────────────────────────────────────────
  const rawOutputBlob = {
    ...analysisData,
    model_used: modelUsed,
    provider,
    is_demo: isDemo,
    latency_ms: latencyMs,
  };

  const { data: inserted, error: insertError } = await client
    .from('ai_menu_analyses')
    .insert({
      merchant_id: merchant.merchantId,
      menu_source_id: menuSource.id,
      summary: analysisData.summary,
      top_dishes: analysisData.top_dishes,
      customer_personas: analysisData.customer_personas,
      taste_tags: analysisData.taste_tags,
      pricing_insights: analysisData.pricing_insights,
      health_positioning: analysisData.health_positioning,
      content_angles: analysisData.content_angles,
      risks: analysisData.risks,
      raw_ai_output: rawOutputBlob,
    })
    .select('id, created_at')
    .single();

  if (insertError) {
    await logAgentRun(client, {
      merchantId: merchant.merchantId,
      agentName: 'menu-analyzer',
      actionType: 'analyze_menu',
      input,
      output: analysisData,
      modelUsed,
      provider,
      status: 'failed',
      errorMessage: `DB insert failed: ${insertError.message}`,
      latencyMs,
    });
    throw new Error(`Could not save analysis: ${insertError.message}`);
  }

  await markMenuSourceStatus(client, menuSource.id, 'processed');

  await logAgentRun(client, {
    merchantId: merchant.merchantId,
    agentName: 'menu-analyzer',
    actionType: 'analyze_menu',
    input,
    output: analysisData,
    modelUsed,
    provider,
    status: 'success',
    errorMessage: null,
    latencyMs,
  });

  return {
    id: inserted!.id as string,
    merchantId: merchant.merchantId,
    createdAt: inserted!.created_at as string,
    modelUsed,
    isDemo,
    data: analysisData,
  };
}

// ── Agent log helper ──────────────────────────────────────────────────────────

interface AgentLogPayload {
  merchantId: string;
  agentName: string;
  actionType: string;
  input: unknown;
  output: unknown;
  modelUsed: string;
  provider: string;
  status: 'success' | 'failed';
  errorMessage: string | null;
  latencyMs: number;
}

async function logAgentRun(
  client: ReturnType<typeof getSupabaseClient>,
  payload: AgentLogPayload,
): Promise<void> {
  if (!client) return;
  // Logging failures should not block the user flow — swallow + console.
  const { error } = await client.from('ai_agent_logs').insert({
    merchant_id: payload.merchantId,
    agent_name: payload.agentName,
    action_type: payload.actionType,
    input_snapshot: payload.input as Record<string, unknown>,
    output_snapshot: (payload.output ?? {}) as Record<string, unknown>,
    model_used: payload.modelUsed,
    provider: payload.provider,
    status: payload.status,
    error_message: payload.errorMessage,
    latency_ms: payload.latencyMs,
  });
  if (error && __DEV__) {
    console.warn('[Studio] Failed to write agent log:', error.message);
  }
}

async function markMenuSourceStatus(
  client: ReturnType<typeof getSupabaseClient>,
  sourceId: string,
  status: 'processed' | 'failed',
): Promise<void> {
  if (!client) return;
  await client
    .from('restaurant_menu_sources')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sourceId);
}
