import { readAsStringAsync } from 'expo-file-system/legacy';
import { Restaurant } from '../../types';
import { getSupabaseClient, getSupabaseUrl } from '../lib/supabase';

export interface VoiceIntent {
  transcript: string;
  displayText: string;
  cuisineFilters: string[];
  tagFilters: string[];
  categoryFilters: string[];
  priceFilter: string | null;
}

// ─── Transcription ────────────────────────────────────────────────────────────

export async function transcribeAudio(uri: string): Promise<string> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseClient = getSupabaseClient();

  // ── Production path: Edge Function (key never in bundle) ──────────────────
  if (supabaseUrl && supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error('Sign in to use voice search.');
    }

    // Read the recorded audio as base64 so we can send it as JSON.
    const audioBase64 = await readAsStringAsync(uri, { encoding: 'base64' });

    const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ type: 'whisper', audioBase64, mimeType: 'audio/m4a' }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Voice transcription failed (${res.status}): ${errBody}`);
    }

    const json = (await res.json()) as { transcript?: unknown; error?: unknown };
    if (typeof json?.transcript !== 'string') {
      throw new Error('Whisper API returned an unexpected response.');
    }
    return json.transcript;
  }

  // ── Dev / demo fallback: direct OpenAI call with EXPO_PUBLIC key ──────────
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    // No key at all — simulate for UI demos.
    await new Promise((r) => setTimeout(r, 800));
    return '我想吃辣的中国菜';
  }

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'audio/m4a',
    name: 'voice.m4a',
  } as unknown as Blob);
  formData.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Whisper API error: ${res.status}`);
  }

  const json = (await res.json()) as { text?: unknown };
  if (typeof json?.text !== 'string') {
    throw new Error('Whisper API returned an unexpected response.');
  }
  return json.text;
}

// ─── NLP Keyword Maps ─────────────────────────────────────────────────────────

const CUISINE_MAP: Array<[string, string[]]> = [
  // Chinese
  ['中国', ['Chinese']], ['中式', ['Chinese']], ['中餐', ['Chinese']],
  ['川菜', ['Chinese']], ['粤菜', ['Chinese']], ['北京', ['Chinese']],
  ['上海', ['Chinese']], ['东北', ['Chinese']], ['湖南', ['Chinese']],
  // Japanese
  ['日本', ['Japanese']], ['日式', ['Japanese']], ['日料', ['Japanese']],
  ['寿司', ['Japanese']], ['拉面', ['Japanese']], ['居酒屋', ['Japanese']],
  // Korean
  ['韩国', ['Korean']], ['韩式', ['Korean']], ['韩餐', ['Korean']],
  ['烤肉', ['Korean']], ['泡菜', ['Korean']], ['韩剧', ['Korean']],
  // Southeast Asian
  ['泰国', ['Thai']], ['泰式', ['Thai']], ['泰餐', ['Thai']],
  ['越南', ['Vietnamese']], ['越式', ['Vietnamese']],
  ['新加坡', ['Singaporean']], ['马来', ['Malaysian']],
  // South Asian
  ['印度', ['Indian']], ['咖喱', ['Indian']],
  // Western
  ['意大利', ['Italian']], ['披萨', ['Italian']], ['意面', ['Italian']],
  ['法国', ['French']], ['法式', ['French']],
  ['墨西哥', ['Mexican']], ['地中海', ['Mediterranean']],
  ['美国', ['American']], ['汉堡', ['American']],
  // English keywords
  ['chinese', ['Chinese']], ['japanese', ['Japanese']], ['korean', ['Korean']],
  ['thai', ['Thai']], ['vietnamese', ['Vietnamese']], ['indian', ['Indian']],
  ['italian', ['Italian']], ['french', ['French']], ['mexican', ['Mexican']],
  ['mediterranean', ['Mediterranean']], ['american', ['American']],
  ['sushi', ['Japanese']], ['ramen', ['Japanese']], ['pizza', ['Italian']],
  ['curry', ['Indian']], ['tacos', ['Mexican']],
];

const TASTE_MAP: Array<[string, { tags: string[]; categories: string[] }]> = [
  ['辣', { tags: ['spicy'], categories: ['actually-spicy'] }],
  ['超辣', { tags: ['spicy'], categories: ['actually-spicy'] }],
  ['很辣', { tags: ['spicy'], categories: ['actually-spicy'] }],
  ['不辣', { tags: ['mild'], categories: [] }],
  ['清淡', { tags: ['mild', 'light'], categories: [] }],
  ['素食', { tags: ['vegetarian'], categories: ['diet-approved'] }],
  ['纯素', { tags: ['vegan'], categories: ['diet-approved'] }],
  ['海鲜', { tags: ['seafood'], categories: [] }],
  ['火锅', { tags: ['hot pot'], categories: [] }],
  ['烧烤', { tags: ['bbq'], categories: [] }],
  ['甜', { tags: ['dessert'], categories: [] }],
  ['地道', { tags: ['authentic'], categories: ['culture-approved', 'local-approved'] }],
  ['正宗', { tags: ['authentic'], categories: ['culture-approved'] }],
  ['本地', { tags: [], categories: ['local-approved'] }],
  ['宵夜', { tags: [], categories: ['late-night'] }],
  ['深夜', { tags: [], categories: ['late-night'] }],
  ['学生', { tags: ['budget'], categories: ['student-favorites'] }],
  ['隐藏', { tags: [], categories: ['hidden-gems'] }],
  ['网红', { tags: [], categories: ['trending-week'] }],
  // English
  ['spicy', { tags: ['spicy'], categories: ['actually-spicy'] }],
  ['vegetarian', { tags: ['vegetarian'], categories: ['diet-approved'] }],
  ['vegan', { tags: ['vegan'], categories: ['diet-approved'] }],
  ['seafood', { tags: ['seafood'], categories: [] }],
  ['authentic', { tags: ['authentic'], categories: ['culture-approved'] }],
  ['local', { tags: [], categories: ['local-approved'] }],
  ['late night', { tags: [], categories: ['late-night'] }],
  ['hidden gem', { tags: [], categories: ['hidden-gems'] }],
  ['trending', { tags: [], categories: ['trending-week'] }],
  ['budget', { tags: ['budget'], categories: ['student-favorites'] }],
];

const PRICE_MAP: Array<[string, string]> = [
  ['便宜', '$'], ['实惠', '$'], ['平价', '$'],
  ['中档', '$$'], ['性价比', '$$'],
  ['贵', '$$$'], ['高档', '$$$'], ['精致', '$$$'],
  ['豪华', '$$$$'], ['米其林', '$$$$'],
  ['cheap', '$'], ['budget', '$'], ['affordable', '$$'],
  ['expensive', '$$$'], ['fancy', '$$$'], ['fine dining', '$$$$'],
];

// ─── Intent Parsing ───────────────────────────────────────────────────────────

function buildDisplayText(
  cuisineFilters: string[],
  tagFilters: string[],
  categoryFilters: string[],
  priceFilter: string | null,
): string {
  const parts: string[] = [];

  if (cuisineFilters.length > 0) parts.push(cuisineFilters.join(' / '));
  if (tagFilters.includes('spicy')) parts.push('spicy');
  if (tagFilters.includes('vegetarian') || tagFilters.includes('vegan')) parts.push('vegetarian-friendly');
  if (categoryFilters.includes('late-night')) parts.push('open late');
  if (categoryFilters.includes('student-favorites')) parts.push('budget-friendly');
  if (categoryFilters.includes('local-approved')) parts.push('local picks');
  if (categoryFilters.includes('hidden-gems')) parts.push('hidden gems');
  if (categoryFilters.includes('culture-approved')) parts.push('authentic');
  if (priceFilter === '$') parts.push('cheap eats');
  else if (priceFilter === '$$$' || priceFilter === '$$$$') parts.push('upscale');

  if (parts.length === 0) return 'restaurants nearby';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' & ' + parts[parts.length - 1];
}

export function parseVoiceIntent(transcript: string): VoiceIntent {
  const text = transcript.toLowerCase();
  const cuisineFilters: string[] = [];
  const tagFilters: string[] = [];
  const categoryFilters: string[] = [];
  let priceFilter: string | null = null;

  for (const [kw, cuisines] of CUISINE_MAP) {
    if (text.includes(kw)) {
      for (const c of cuisines) {
        if (!cuisineFilters.includes(c)) cuisineFilters.push(c);
      }
    }
  }

  for (const [kw, { tags, categories }] of TASTE_MAP) {
    if (text.includes(kw)) {
      for (const t of tags) if (!tagFilters.includes(t)) tagFilters.push(t);
      for (const c of categories) if (!categoryFilters.includes(c)) categoryFilters.push(c);
    }
  }

  for (const [kw, price] of PRICE_MAP) {
    if (text.includes(kw)) { priceFilter = price; break; }
  }

  const displayText = buildDisplayText(cuisineFilters, tagFilters, categoryFilters, priceFilter);
  return { transcript, displayText, cuisineFilters, tagFilters, categoryFilters, priceFilter };
}

// ─── Restaurant Filtering ─────────────────────────────────────────────────────

export function filterRestaurantsByIntent(
  restaurants: Restaurant[],
  intent: VoiceIntent,
): Restaurant[] {
  let results = [...restaurants];

  if (intent.cuisineFilters.length > 0) {
    results = results.filter((r) =>
      intent.cuisineFilters.some(
        (c) =>
          r.cuisine.toLowerCase().includes(c.toLowerCase()) ||
          r.tags.some((t) => t.toLowerCase().includes(c.toLowerCase())),
      ),
    );
  }

  if (intent.tagFilters.length > 0) {
    const withTags = results.filter((r) =>
      intent.tagFilters.some((t) =>
        r.tags.some((rt) => rt.toLowerCase().includes(t.toLowerCase())),
      ),
    );
    if (withTags.length > 0) results = withTags;
  }

  if (intent.categoryFilters.length > 0) {
    const withCats = results.filter((r) =>
      intent.categoryFilters.some((c) => r.categories.includes(c)),
    );
    if (withCats.length > 0) results = withCats;
  }

  if (intent.priceFilter) {
    const withPrice = results.filter((r) => r.price === intent.priceFilter);
    if (withPrice.length > 0) results = withPrice;
  }

  return results.sort((a, b) => b.tasteMatchPercent - a.tasteMatchPercent);
}
