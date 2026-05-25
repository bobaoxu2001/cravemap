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
  /** Day label, e.g. "Day 1 — Monday". */
  date: string;
  channel: string;
  contentType: string;
  caption: string;
  hashtags: string[];
  /** The star dish featured in this post. */
  heroDish: string;
  /** Target customer segment for this day, e.g. "Office lunch crowd". */
  targetSegment: string;
  /** Clear call-to-action text, e.g. "Tag a friend who needs this." */
  cta: string;
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
        required: ['date', 'channel', 'contentType', 'caption', 'hashtags', 'heroDish', 'targetSegment', 'cta'],
        properties: {
          date: { type: 'string' },
          channel: { type: 'string' },
          contentType: { type: 'string' },
          caption: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' } },
          heroDish: { type: 'string' },
          targetSegment: { type: 'string' },
          cta: { type: 'string' },
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
Generate a focused 7-day local restaurant marketing campaign. Requirements:
1. Campaign title (punchy, specific to this restaurant) + one-sentence goal.
2. A content calendar with exactly 7 posts — one per day, Mon–Sun. Each post must include:
   - date: "Day N — [Weekday]" format (e.g. "Day 1 — Monday")
   - channel: one of instagram, tiktok, facebook, or email
   - contentType: e.g. "Reel", "Feed Post", "Story", "Short Video", "Email Blast"
   - caption: ready-to-post caption text (1-3 sentences)
   - hashtags: 4-6 relevant hashtags
   - heroDish: the featured menu item for that day
   - targetSegment: the specific customer type to reach (e.g. "Late-night students", "Date night couples")
   - cta: a specific, actionable call-to-action (e.g. "Tag someone who needs this tonight.")
3. Two short video scripts (30–45 seconds) — TikTok/Reel format with scene-by-scene breakdowns.
4. Three Instagram captions — polished, ready to post with hashtags.
5. Three CraveMap recommendation cards — short punchy headline + 1-2 sentence body + CTA.

Local and genuine voice. No corporate-speak. Write like a food-obsessed local would.`;

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
      date: 'Day 1 — Monday',
      channel: 'instagram',
      contentType: 'Reel',
      caption: 'This is what 15 years of muscle memory looks like. 🍜 Hand-pulled noodles, every single morning.',
      hashtags: ['#handpulled', '#nycfood', '#chinesefood', '#noodlelovers', '#queens'],
      heroDish: 'Hand-pulled Beef Noodle Soup',
      targetSegment: 'Foodies and food content creators',
      cta: 'Save this for your next noodle craving. 🔖',
    },
    {
      date: 'Day 2 — Tuesday',
      channel: 'tiktok',
      contentType: 'Short Video',
      caption: "POV: you finally found the best wonton spot in NYC and it's been 2 blocks away the whole time.",
      hashtags: ['#nycfoodie', '#wontons', '#hiddengems', '#foryoupage'],
      heroDish: 'Pork Wontons in Chili Oil',
      targetSegment: 'TikTok food explorers, 18–30',
      cta: 'Tag the friend you always drag to restaurants 👇',
    },
    {
      date: 'Day 3 — Wednesday',
      channel: 'instagram',
      contentType: 'Feed Post',
      caption: "Midweek lunch sorted. Dan Dan Noodles — spicy, nutty, deeply satisfying. $13 and it hits every time. 🌶️",
      hashtags: ['#dandannoodles', '#lunchnyc', '#chinesenoodles', '#nycfood', '#mamaliu'],
      heroDish: 'Spicy Dan Dan Noodles',
      targetSegment: 'Office lunch crowd in the neighborhood',
      cta: 'Walk-ins welcome. See you at noon.',
    },
    {
      date: 'Day 4 — Thursday',
      channel: 'email',
      contentType: 'Email Blast',
      caption: "Thursday special: Scallion Pancake + any noodle bowl for $18. This weekend only — reply to claim your table.",
      hashtags: [],
      heroDish: 'Scallion Pancake + Noodle Bowl',
      targetSegment: 'Email subscribers and regulars',
      cta: 'Reply "TABLE" to reserve your spot this weekend.',
    },
    {
      date: 'Day 5 — Friday',
      channel: 'tiktok',
      contentType: 'Short Video',
      caption: "GRWM: Friday night edition. First stop — Mama Liu's. The chili oil wonton situation is unreal. 🫦",
      hashtags: ['#fridaynight', '#nycdate', '#foodtok', '#wontons', '#nycfoodie'],
      heroDish: 'Pork Wontons in Chili Oil',
      targetSegment: 'Date night couples and friend groups',
      cta: "It's Friday. You deserve this. Link in bio for directions.",
    },
    {
      date: 'Day 6 — Saturday',
      channel: 'instagram',
      contentType: 'Story',
      caption: 'Saturday lunch = hand-pulled noodle soup and nowhere to be. This is the vibe. 🍜☁️',
      hashtags: ['#saturdaylunch', '#soupseason', '#nycfood', '#noodlesoup'],
      heroDish: 'Hand-pulled Beef Noodle Soup',
      targetSegment: 'Weekend families and casual diners',
      cta: 'Open 11am–9pm today. No reservations needed.',
    },
    {
      date: 'Day 7 — Sunday',
      channel: 'instagram',
      contentType: 'Carousel',
      caption: "7 dishes. 1 week. Here's everything we made with you in mind. Swipe to see your next order. ➡️",
      hashtags: ['#sundayfood', '#menuguide', '#nycchinesefood', '#mamaliu', '#weekendeats'],
      heroDish: 'Full menu showcase',
      targetSegment: 'New followers and undecided diners',
      cta: 'Which one are you ordering first? Drop it below 👇',
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
