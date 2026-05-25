// ============================================================================
// CraveMap Studio — generateRestaurantCampaign
// ============================================================================
// Takes menu analysis output (or raw context) and generates a full marketing
// campaign. Output maps directly to the ai_campaigns table columns.
// ============================================================================

import { callGeminiStructured, GeminiResult } from './gemini';
import type { MenuAnalysisOutput } from './menuAnalysis';

// ── Input ─────────────────────────────────────────────────────────────────────

export interface CampaignInput {
  restaurantName: string;
  /** Optional — pass the output of analyzeRestaurantMenu for richer campaigns. */
  menuAnalysis?: MenuAnalysisOutput;
  /** Free-form goal if no analysis is available, e.g. "drive weekend foot traffic". */
  campaignGoal: string;
  /** Target channels. Defaults to all. */
  channels?: Array<'instagram' | 'tiktok' | 'sms' | 'email'>;
  city?: string;
  cuisineType?: string;
}

// ── Output (mirrors ai_campaigns columns) ─────────────────────────────────────

export interface ContentCalendarItem {
  /** ISO date string or relative label like "Week 1 - Monday". */
  date: string;
  channel: string;
  contentType: string;
  caption: string;
  hashtags: string[];
}

export interface VideoScript {
  title: string;
  /** e.g. "30s Reel", "60s TikTok" */
  format: string;
  hookLine: string;
  scenes: Array<{
    sceneNumber: number;
    visualDescription: string;
    voiceover: string;
    duration: string;
  }>;
  callToAction: string;
}

export interface InstagramCaption {
  dishOrTheme: string;
  caption: string;
  hashtags: string[];
  /** e.g. "Feed post", "Story", "Reel cover" */
  format: string;
}

export interface RecommendationCard {
  /** Short punchy headline, fits on a card. */
  headline: string;
  /** 1-2 sentence body copy. */
  body: string;
  /** Dish or theme this card promotes. */
  subject: string;
  callToAction: string;
}

export interface CampaignOutput {
  campaign_title: string;
  campaign_goal: string;
  content_calendar: ContentCalendarItem[];
  short_video_scripts: VideoScript[];
  instagram_captions: InstagramCaption[];
  recommendation_cards: RecommendationCard[];
}

export type CampaignResult = GeminiResult<CampaignOutput>;

// ── Schema ────────────────────────────────────────────────────────────────────

const CAMPAIGN_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: [
    'campaign_title',
    'campaign_goal',
    'content_calendar',
    'short_video_scripts',
    'instagram_captions',
    'recommendation_cards',
  ],
  properties: {
    campaign_title: { type: 'string' },
    campaign_goal: { type: 'string' },
    content_calendar: {
      type: 'array',
      items: {
        type: 'object',
        required: ['date', 'channel', 'contentType', 'caption', 'hashtags'],
        properties: {
          date: { type: 'string' },
          channel: { type: 'string' },
          contentType: { type: 'string' },
          caption: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    short_video_scripts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'format', 'hookLine', 'scenes', 'callToAction'],
        properties: {
          title: { type: 'string' },
          format: { type: 'string' },
          hookLine: { type: 'string' },
          scenes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['sceneNumber', 'visualDescription', 'voiceover', 'duration'],
              properties: {
                sceneNumber: { type: 'integer' },
                visualDescription: { type: 'string' },
                voiceover: { type: 'string' },
                duration: { type: 'string' },
              },
            },
          },
          callToAction: { type: 'string' },
        },
      },
    },
    instagram_captions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['dishOrTheme', 'caption', 'hashtags', 'format'],
        properties: {
          dishOrTheme: { type: 'string' },
          caption: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' } },
          format: { type: 'string' },
        },
      },
    },
    recommendation_cards: {
      type: 'array',
      items: {
        type: 'object',
        required: ['headline', 'body', 'subject', 'callToAction'],
        properties: {
          headline: { type: 'string' },
          body: { type: 'string' },
          subject: { type: 'string' },
          callToAction: { type: 'string' },
        },
      },
    },
  },
};

const SYSTEM_INSTRUCTION = `You are an expert food & beverage marketing strategist.
Create compelling, channel-native marketing campaigns for restaurants.
Write in a voice that feels authentic — not corporate or generic.
Hashtags should be a mix of broad reach and niche community tags.
All output must be valid JSON matching the requested schema exactly.`;

// ── Function ──────────────────────────────────────────────────────────────────

export async function generateRestaurantCampaign(
  input: CampaignInput,
): Promise<CampaignResult> {
  const channels = input.channels ?? ['instagram', 'tiktok', 'sms', 'email'];

  const contextLines: string[] = [
    `Restaurant: ${input.restaurantName}`,
    input.cuisineType ? `Cuisine: ${input.cuisineType}` : '',
    input.city ? `City: ${input.city}` : '',
    `Campaign goal: ${input.campaignGoal}`,
    `Target channels: ${channels.join(', ')}`,
  ].filter(Boolean);

  let analysisSection = '';
  if (input.menuAnalysis) {
    const a = input.menuAnalysis;
    const dishes = a.top_dishes.map((d) => `  - ${d.name}: ${d.marketingAngle}`).join('\n');
    const personas = a.customer_personas.map((p) => `  - ${p.name}: ${p.description}`).join('\n');
    analysisSection = `
Menu insights:
  Summary: ${a.summary}
  Top dishes:
${dishes}
  Customer personas:
${personas}
  Taste tags: ${a.taste_tags.join(', ')}
  Pricing: ${a.pricing_insights.tier} — ${a.pricing_insights.positioning}
`;
  }

  const userPrompt = `${contextLines.join('\n')}
${analysisSection}
Generate a 2-week marketing campaign that includes:
1. A campaign title and one-sentence goal statement.
2. A content calendar with at least 6 posts across the requested channels, spread over 2 weeks.
3. Two short video scripts (30–60 second Reels/TikToks) — include scene-by-scene breakdowns.
4. Three ready-to-post Instagram captions with hashtags for different dishes or themes.
5. Three recommendation card copy sets (headline + body + CTA) for use in the CraveMap app or email.

Make the copy feel local and genuine — this restaurant has real character.`;

  return callGeminiStructured<CampaignOutput>({
    systemInstruction: SYSTEM_INSTRUCTION,
    userPrompt,
    responseSchema: CAMPAIGN_SCHEMA,
    temperature: 0.7,
  });
}

// ── Example (for tests / documentation) ──────────────────────────────────────

export const EXAMPLE_CAMPAIGN_INPUT: CampaignInput = {
  restaurantName: "Mama Liu's Noodle House",
  campaignGoal: 'Drive weekend dinner reservations and first-time visitors from social media',
  channels: ['instagram', 'tiktok'],
  city: 'New York City',
  cuisineType: 'Chinese',
};

export const EXAMPLE_CAMPAIGN_OUTPUT: CampaignOutput = {
  campaign_title: "15 Years of Pull — Mama Liu's Noodle House",
  campaign_goal: 'Drive weekend dinner traffic from Instagram and TikTok to new first-time diners.',
  content_calendar: [
    {
      date: 'Week 1 - Monday',
      channel: 'instagram',
      contentType: 'Reel',
      caption: 'This is what 15 years of muscle memory looks like. 🍜 Hand-pulled noodles, every single morning.',
      hashtags: ['#handpulled', '#nycfood', '#chinesefood', '#noodlelovers', '#queens'],
    },
    {
      date: 'Week 1 - Thursday',
      channel: 'tiktok',
      contentType: 'Short video',
      caption: "POV: you finally found the best wonton spot in NYC and it's been 2 blocks away the whole time.",
      hashtags: ['#nycfoodie', '#wontons', '#hiddengems', '#foryoupage'],
    },
  ],
  short_video_scripts: [
    {
      title: 'The Pull — Noodle-making process video',
      format: '30s Reel',
      hookLine: "They've been pulling these noodles by hand every morning for 15 years.",
      scenes: [
        {
          sceneNumber: 1,
          visualDescription: 'Close-up of hands stretching dough, steam rising',
          voiceover: "Every morning at 7am, before the doors open…",
          duration: '5s',
        },
        {
          sceneNumber: 2,
          visualDescription: 'Noodles dropping into boiling broth, slow-motion',
          voiceover: "…the noodles are already being made.",
          duration: '5s',
        },
        {
          sceneNumber: 3,
          visualDescription: 'Finished bowl of beef noodle soup on table, overhead shot',
          voiceover: "Beef noodle soup. $14. Worth every penny.",
          duration: '8s',
        },
      ],
      callToAction: 'Find us on CraveMap — link in bio.',
    },
  ],
  instagram_captions: [
    {
      dishOrTheme: 'Pork Wontons in Chili Oil',
      caption: "The chili oil has been simmering for 15 years. You can taste it. 🌶️ Pork wontons, $12.",
      hashtags: ['#wontons', '#chilioil', '#nycchinesefood', '#dumplingsofinstagram', '#mamaliu'],
      format: 'Feed post',
    },
  ],
  recommendation_cards: [
    {
      headline: '15 Years. Still Hand-Pulled.',
      body: "Mama Liu's has been making noodles by hand since 2009. The beef noodle soup alone is worth the trip.",
      subject: 'Hand-pulled Beef Noodle Soup',
      callToAction: 'Get directions →',
    },
  ],
};
