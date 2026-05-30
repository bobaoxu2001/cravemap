// ============================================================================
// CraveMap Studio — analyzeRestaurantMenu
// ============================================================================
// Sends raw menu text to Gemini and returns structured insights that map
// directly to the ai_menu_analyses table columns.
// ============================================================================

import { callGeminiStructured, GeminiResult } from './gemini';

// ── Input ─────────────────────────────────────────────────────────────────────

export interface MenuAnalysisInput {
  restaurantName: string;
  /** Pasted or OCR-extracted menu text. Required. */
  menuText: string;
  cuisineType?: string;
  city?: string;
  /** Optional extra context (e.g. "we focus on lunch crowds"). */
  additionalContext?: string;
}

// ── Output (mirrors ai_menu_analyses columns) ─────────────────────────────────

export interface TopDish {
  name: string;
  estimatedPrice: string;
  /** One-sentence hook for marketing copy. */
  marketingAngle: string;
  tags: string[];
}

export interface CustomerPersona {
  /** Short persona label, e.g. "The Budget Foodie". */
  name: string;
  description: string;
  motivations: string[];
  recommendedDishes: string[];
}

export interface PricingInsights {
  tier: '$' | '$$' | '$$$' | '$$$$';
  positioning: string;
  /** Action items the restaurant could take, e.g. "add a lunch special". */
  opportunities: string[];
}

export interface HealthPositioning {
  highlights: string[];
  dietaryOptions: string[];
  /** Phrases safe to use in marketing, e.g. "naturally gluten-friendly". */
  marketingClaims: string[];
}

export interface ContentAngle {
  /** Short campaign theme name. */
  theme: string;
  /** 1-2 sentences explaining the angle. */
  description: string;
  /** Suggested format, e.g. "Reel", "Story", "Email". */
  suggestedFormat: string;
}

export interface RiskNote {
  /** Short risk category, e.g. "Pricing", "Menu gap", "Missing data". */
  category: string;
  description: string;
  recommendation: string;
}

export interface MenuAnalysisOutput {
  summary: string;
  top_dishes: TopDish[];
  customer_personas: CustomerPersona[];
  taste_tags: string[];
  pricing_insights: PricingInsights;
  health_positioning: HealthPositioning;
  content_angles: ContentAngle[];
  risks: RiskNote[];
}

export type MenuAnalysisResult = GeminiResult<MenuAnalysisOutput>;

// ── Schema ────────────────────────────────────────────────────────────────────

const MENU_ANALYSIS_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: [
    'summary',
    'top_dishes',
    'customer_personas',
    'taste_tags',
    'pricing_insights',
    'health_positioning',
    'content_angles',
    'risks',
  ],
  properties: {
    summary: { type: 'string' },
    top_dishes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'estimatedPrice', 'marketingAngle', 'tags'],
        properties: {
          name: { type: 'string' },
          estimatedPrice: { type: 'string' },
          marketingAngle: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    customer_personas: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description', 'motivations', 'recommendedDishes'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          motivations: { type: 'array', items: { type: 'string' } },
          recommendedDishes: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    taste_tags: { type: 'array', items: { type: 'string' } },
    pricing_insights: {
      type: 'object',
      required: ['tier', 'positioning', 'opportunities'],
      properties: {
        tier: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'] },
        positioning: { type: 'string' },
        opportunities: { type: 'array', items: { type: 'string' } },
      },
    },
    health_positioning: {
      type: 'object',
      required: ['highlights', 'dietaryOptions', 'marketingClaims'],
      properties: {
        highlights: { type: 'array', items: { type: 'string' } },
        dietaryOptions: { type: 'array', items: { type: 'string' } },
        marketingClaims: { type: 'array', items: { type: 'string' } },
      },
    },
    content_angles: {
      type: 'array',
      items: {
        type: 'object',
        required: ['theme', 'description', 'suggestedFormat'],
        properties: {
          theme: { type: 'string' },
          description: { type: 'string' },
          suggestedFormat: { type: 'string' },
        },
      },
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['category', 'description', 'recommendation'],
        properties: {
          category: { type: 'string' },
          description: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
  },
};

const SYSTEM_INSTRUCTION = `You are an expert restaurant marketing analyst.
Analyze the provided menu and return actionable business insights.
Be specific and concrete — avoid generic advice.
All output must be valid JSON matching the requested schema exactly.`;

// ── Function ──────────────────────────────────────────────────────────────────

// Gemini's responseSchema is best-effort, not a hard guarantee — under load it
// can omit a "required" array or object. The result screens map over these
// fields directly, so a missing array would crash the view (no error boundary
// on that path). Coerce the model output into a guaranteed-safe shape.
const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

export function normalizeMenuAnalysisOutput(raw: Partial<MenuAnalysisOutput> | null | undefined): MenuAnalysisOutput {
  const r = raw ?? {};
  const pricing = r.pricing_insights ?? ({} as PricingInsights);
  const health = r.health_positioning ?? ({} as HealthPositioning);
  return {
    summary: asString(r.summary),
    top_dishes: asArray<TopDish>(r.top_dishes),
    customer_personas: asArray<CustomerPersona>(r.customer_personas),
    taste_tags: asArray<string>(r.taste_tags),
    pricing_insights: {
      tier: pricing.tier ?? '$$',
      positioning: asString(pricing.positioning),
      opportunities: asArray<string>(pricing.opportunities),
    },
    health_positioning: {
      highlights: asArray<string>(health.highlights),
      dietaryOptions: asArray<string>(health.dietaryOptions),
      marketingClaims: asArray<string>(health.marketingClaims),
    },
    content_angles: asArray<ContentAngle>(r.content_angles),
    risks: asArray<RiskNote>(r.risks),
  };
}

export async function analyzeRestaurantMenu(
  input: MenuAnalysisInput,
): Promise<MenuAnalysisResult> {
  const contextLines: string[] = [
    `Restaurant: ${input.restaurantName}`,
    input.cuisineType ? `Cuisine: ${input.cuisineType}` : '',
    input.city ? `City: ${input.city}` : '',
    input.additionalContext ? `Additional context: ${input.additionalContext}` : '',
  ].filter(Boolean);

  const userPrompt = `${contextLines.join('\n')}

---MENU START---
${input.menuText.trim()}
---MENU END---

Analyze this menu and return:
1. A concise executive summary (2-3 sentences).
2. The top 5 most marketable dishes with price estimates and a one-sentence marketing hook each.
3. 2-3 customer personas who would love this restaurant.
4. A flat list of taste tags (e.g. "spicy", "umami-rich", "vegetarian-friendly").
5. Pricing insights — what tier the restaurant occupies and 2-3 opportunities.
6. Health positioning highlights and any dietary accommodation claims that are safe to make.
7. 3-5 content angles for marketing — campaign themes with suggested formats.
8. 2-4 risks or missing-information notes — be honest about gaps in the menu, pricing, or positioning.`;

  const result = await callGeminiStructured<MenuAnalysisOutput>({
    systemInstruction: SYSTEM_INSTRUCTION,
    userPrompt,
    responseSchema: MENU_ANALYSIS_SCHEMA,
    temperature: 0.4,
  });

  return { ...result, data: normalizeMenuAnalysisOutput(result.data) };
}

// ── Example (for tests / documentation) ──────────────────────────────────────

export const EXAMPLE_MENU_ANALYSIS_INPUT: MenuAnalysisInput = {
  restaurantName: "Mama Liu's Noodle House",
  menuText: `
    Hand-pulled Beef Noodle Soup  $14
    Spicy Dan Dan Noodles  $13
    Pork Wontons in Chili Oil (10pc)  $12
    Vegetable Dumplings (8pc)  $11
    Mapo Tofu  $13
    Yu Xiang Eggplant  $12
    Kung Pao Chicken  $14
    Fried Rice  $11
    Scallion Pancake  $7
    Bubble Tea (multiple flavors)  $6
  `,
  cuisineType: 'Chinese',
  city: 'New York City',
  additionalContext: 'Family-owned, been open 15 years, popular with local Chinese community',
};

export const EXAMPLE_MENU_ANALYSIS_OUTPUT: MenuAnalysisOutput = {
  summary:
    "Mama Liu's is a neighborhood staple with an authentic Sichuan-leaning menu at accessible price points. The hand-pulled noodles and chili-forward dishes are natural social media anchors. Pricing sits solidly in the $$ tier with room to bundle value through combo deals.",
  top_dishes: [
    {
      name: 'Hand-pulled Beef Noodle Soup',
      estimatedPrice: '$14',
      marketingAngle: 'Made fresh daily — watch the noodles being pulled right in front of you.',
      tags: ['handmade', 'comfort', 'hearty'],
    },
    {
      name: 'Pork Wontons in Chili Oil',
      estimatedPrice: '$12',
      marketingAngle: "Grandma's secret chili oil recipe, 15 years in the making.",
      tags: ['spicy', 'shareable', 'crowd-pleaser'],
    },
  ],
  customer_personas: [
    {
      name: 'The Authentic Hunter',
      description: 'Seeks regional Chinese food that reminds them of home or travels.',
      motivations: ['authenticity', 'cultural connection', 'word-of-mouth trust'],
      recommendedDishes: ['Hand-pulled Beef Noodle Soup', 'Mapo Tofu'],
    },
  ],
  taste_tags: ['spicy', 'umami-rich', 'handmade', 'vegetarian-options', 'comfort-food'],
  pricing_insights: {
    tier: '$$',
    positioning: 'Affordable neighborhood Chinese — premium quality without fine-dining prices.',
    opportunities: [
      'Add a weekday lunch combo (soup + dumpling) at $16 to drive midday traffic.',
      'Bundle bubble tea with any main for $2 off — boosts average ticket size.',
    ],
  },
  health_positioning: {
    highlights: ['Fresh hand-pulled noodles made in-house', 'Vegetables sourced daily'],
    dietaryOptions: ['Vegetable dumplings', 'Mapo tofu (can be made vegan)', 'Yu Xiang Eggplant'],
    marketingClaims: ['No MSG added', 'Vegetarian-friendly options available'],
  },
  content_angles: [
    {
      theme: 'Behind the Pull',
      description: 'Show the daily noodle-making ritual. People love seeing craft in motion — perfect for short-form video.',
      suggestedFormat: 'Reel',
    },
    {
      theme: '15 Years, One Block',
      description: 'Lean into the family-owned, neighborhood-staple story. Long-form photo essay format works well here.',
      suggestedFormat: 'Carousel',
    },
    {
      theme: 'Locals Order This',
      description: 'Feature what regulars actually order vs. what tourists order. Builds insider credibility.',
      suggestedFormat: 'Story series',
    },
  ],
  risks: [
    {
      category: 'Menu gap',
      description: 'No explicitly labeled vegan dishes despite several plant-forward items.',
      recommendation: 'Mark Yu Xiang Eggplant and vegetable dumplings as vegan-friendly to capture that audience.',
    },
    {
      category: 'Missing data',
      description: 'No customer review snippets provided — sentiment analysis is limited.',
      recommendation: 'Paste 5-10 Yelp or Google review snippets next time for richer persona work.',
    },
  ],
};
