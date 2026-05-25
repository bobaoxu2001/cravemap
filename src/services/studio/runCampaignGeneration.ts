// ============================================================================
// CraveMap Studio — Campaign Generation orchestrator
// ============================================================================
// 1. Fetch merchant + latest ai_menu_analyses for the signed-in user
// 2. Call generateRestaurantCampaign() (or demo output if no API key)
// 3. Insert ai_campaigns row
// 4. Insert ai_agent_logs row (success or failure)
// ============================================================================

import { getSupabaseClient } from '../../lib/supabase';
import {
  generateRestaurantCampaign,
  EXAMPLE_CAMPAIGN_OUTPUT,
  type CampaignOutput,
} from './campaignGeneration';
import { getMerchantForUser, type MerchantSnapshot } from './runMenuAnalysis';
import type { MenuAnalysisOutput } from './menuAnalysis';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoredCampaign {
  id: string;
  merchantId: string;
  data: CampaignOutput;
  createdAt: string;
  modelUsed: string;
  isDemo: boolean;
}

export class StudioNoAnalysisError extends Error {
  constructor() {
    super('Run an AI menu analysis first — the campaign generator needs those insights.');
    this.name = 'StudioNoAnalysisError';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }
  return client;
}

function hasGeminiKey(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
}

async function getLatestAnalysisForMerchant(
  merchantId: string,
): Promise<{ data: MenuAnalysisOutput; id: string } | null> {
  const client = requireClient();
  const { data, error } = await client
    .from('ai_menu_analyses')
    .select(
      'id, summary, top_dishes, customer_personas, taste_tags, pricing_insights, health_positioning, content_angles, risks',
    )
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id as string,
    data: {
      summary: (data.summary ?? '') as string,
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

// ── Read query ─────────────────────────────────────────────────────────────────

export async function getLatestCampaign(userId: string): Promise<StoredCampaign | null> {
  const merchant = await getMerchantForUser(userId).catch(() => null);
  if (!merchant) return null;

  const client = requireClient();
  const { data, error } = await client
    .from('ai_campaigns')
    .select(
      'id, merchant_id, created_at, campaign_title, campaign_goal, content_calendar, short_video_scripts, instagram_captions, recommendation_cards, raw_ai_output',
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
      campaign_title: (data.campaign_title ?? '') as string,
      campaign_goal: (data.campaign_goal ?? '') as string,
      content_calendar: (data.content_calendar ?? []) as CampaignOutput['content_calendar'],
      short_video_scripts: (data.short_video_scripts ?? []) as CampaignOutput['short_video_scripts'],
      instagram_captions: (data.instagram_captions ?? []) as CampaignOutput['instagram_captions'],
      recommendation_cards: (data.recommendation_cards ?? []) as CampaignOutput['recommendation_cards'],
    },
  };
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function runCampaignGeneration(userId: string): Promise<StoredCampaign> {
  const client = requireClient();

  const merchant: MerchantSnapshot | null = await getMerchantForUser(userId);
  if (!merchant) {
    throw new Error('No merchant profile found. Please complete onboarding first.');
  }

  const latestAnalysis = await getLatestAnalysisForMerchant(merchant.merchantId);
  if (!latestAnalysis) throw new StudioNoAnalysisError();

  const isDemo = !hasGeminiKey();
  const startedAt = Date.now();

  let campaignData: CampaignOutput;
  let modelUsed: string;
  let provider: string;
  let latencyMs: number;

  if (isDemo) {
    await new Promise((r) => setTimeout(r, 800));
    campaignData = EXAMPLE_CAMPAIGN_OUTPUT;
    modelUsed = 'demo-mock';
    provider = 'demo';
    latencyMs = Date.now() - startedAt;
  } else {
    try {
      const result = await generateRestaurantCampaign({
        restaurantName: merchant.restaurantName,
        menuAnalysis: latestAnalysis.data,
        campaignGoal: 'Drive new foot traffic and social engagement over the next 7 days',
        channels: ['instagram', 'tiktok'],
        city: merchant.city ?? undefined,
        cuisineType: merchant.cuisineType ?? undefined,
      });
      campaignData = result.data;
      modelUsed = result.model_used;
      provider = result.provider;
      latencyMs = result.latency_ms;
    } catch (err) {
      latencyMs = Date.now() - startedAt;
      await logAgentRun(client, {
        merchantId: merchant.merchantId,
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
        modelUsed: 'gemini-2.0-flash',
        provider: 'google',
        latencyMs,
        analysisId: latestAnalysis.id,
      });
      throw err;
    }
  }

  // ── Persist campaign ────────────────────────────────────────────────────────
  const rawOutputBlob = {
    ...campaignData,
    model_used: modelUsed,
    provider,
    is_demo: isDemo,
    latency_ms: latencyMs,
  };

  const { data: inserted, error: insertError } = await client
    .from('ai_campaigns')
    .insert({
      merchant_id: merchant.merchantId,
      menu_analysis_id: latestAnalysis.id,
      campaign_title: campaignData.campaign_title,
      campaign_goal: campaignData.campaign_goal,
      content_calendar: campaignData.content_calendar,
      short_video_scripts: campaignData.short_video_scripts,
      instagram_captions: campaignData.instagram_captions,
      recommendation_cards: campaignData.recommendation_cards,
      raw_ai_output: rawOutputBlob,
    })
    .select('id, created_at')
    .single();

  if (insertError) {
    await logAgentRun(client, {
      merchantId: merchant.merchantId,
      status: 'failed',
      errorMessage: `DB insert failed: ${insertError.message}`,
      modelUsed,
      provider,
      latencyMs,
      analysisId: latestAnalysis.id,
    });
    throw new Error(`Could not save campaign: ${insertError.message}`);
  }

  await logAgentRun(client, {
    merchantId: merchant.merchantId,
    status: 'success',
    errorMessage: null,
    modelUsed,
    provider,
    latencyMs,
    analysisId: latestAnalysis.id,
  });

  return {
    id: inserted!.id as string,
    merchantId: merchant.merchantId,
    createdAt: inserted!.created_at as string,
    modelUsed,
    isDemo,
    data: campaignData,
  };
}

// ── Agent log helper ──────────────────────────────────────────────────────────

interface LogPayload {
  merchantId: string;
  status: 'success' | 'failed';
  errorMessage: string | null;
  modelUsed: string;
  provider: string;
  latencyMs: number;
  analysisId: string;
}

async function logAgentRun(
  client: ReturnType<typeof getSupabaseClient>,
  payload: LogPayload,
): Promise<void> {
  if (!client) return;
  const { error } = await client.from('ai_agent_logs').insert({
    merchant_id: payload.merchantId,
    agent_name: 'campaign-generator',
    action_type: 'generate_campaign',
    input_snapshot: { menu_analysis_id: payload.analysisId },
    output_snapshot: {},
    model_used: payload.modelUsed,
    provider: payload.provider,
    status: payload.status,
    error_message: payload.errorMessage,
    latency_ms: payload.latencyMs,
  });
  if (error && __DEV__) {
    console.warn('[Studio] Failed to write campaign agent log:', error.message);
  }
}
