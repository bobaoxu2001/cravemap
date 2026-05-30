// CraveMap Studio — Gemini AI client
//
// API keys never ship in the client bundle. All calls go through the
// `ai-proxy` Supabase Edge Function which holds GEMINI_API_KEY as a server
// secret. In demo mode (no Supabase configured) the client falls back to
// EXPO_PUBLIC_GEMINI_API_KEY so local development still works.
//
// Deploy the proxy:
//   supabase functions deploy ai-proxy
//   supabase secrets set GEMINI_API_KEY=<your-key>

import { getSupabaseClient, getSupabaseUrl } from '../../lib/supabase';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

// A stalled connection must not hang the Studio UI indefinitely (it promises
// results "in under 30 seconds"). Abort and surface a network error instead.
const REQUEST_TIMEOUT_MS = 45_000;
// Gemini flash routinely returns 429 (rate limit) / 503 (overloaded). Retry a
// couple of times with backoff before giving up so a transient blip doesn't
// force the user to manually re-run.
const MAX_RETRIES = 2;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GeminiProvider = 'google';

// ── Public types ─────────────────────────────────────────────────────────────

export interface GeminiCallOptions {
  /** Prompt content sent as the user turn. */
  userPrompt: string;
  /**
   * JSON Schema (OpenAPI subset) that Gemini will conform its response to.
   * Use "type": "object" at the root — Gemini rejects bare arrays.
   */
  responseSchema: Record<string, unknown>;
  /** System instruction prepended before the user turn. */
  systemInstruction?: string;
  /** Defaults to gemini-2.0-flash. */
  model?: string;
  /** Sampling temperature. Lower = more deterministic. Default 0.4. */
  temperature?: number;
}

/** Wraps the AI output with provenance fields for ai_agent_logs. */
export interface GeminiResult<T> {
  data: T;
  /** Populated model string for ai_agent_logs.model_used. */
  model_used: string;
  /** Always 'google' — for ai_agent_logs.provider. */
  provider: GeminiProvider;
  /** Round-trip latency in milliseconds, for ai_agent_logs.latency_ms. */
  latency_ms: number;
}

// ── Core call ─────────────────────────────────────────────────────────────────

/**
 * Call the Gemini API and return a strongly-typed, schema-validated JSON
 * response.  Throws on network errors, API errors, or invalid JSON.
 */
export async function callGeminiStructured<T>(
  opts: GeminiCallOptions,
): Promise<GeminiResult<T>> {
  const model = opts.model ?? DEFAULT_MODEL;

  const body: GeminiRequestBody = {
    contents: [{ role: 'user', parts: [{ text: opts.userPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: opts.responseSchema,
      temperature: opts.temperature ?? 0.4,
    },
  };

  if (opts.systemInstruction) {
    body.system_instruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const start = Date.now();

  // Route through the Edge Function when Supabase is configured so the API
  // key lives only on the server. Fall back to the EXPO_PUBLIC key for local
  // dev / demo mode without Supabase.
  const supabaseUrl = getSupabaseUrl();
  const supabaseClient = getSupabaseClient();
  let res: Response;
  if (supabaseUrl && supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new GeminiConfigError('Sign in to use CraveMap Studio AI features.');
    }
    const edgeUrl = `${supabaseUrl}/functions/v1/ai-proxy`;
    res = await fetchWithRetry(edgeUrl, { type: 'gemini', model, ...body }, `Bearer ${accessToken}`);
  } else {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiConfigError(
        'AI features require a Supabase project or EXPO_PUBLIC_GEMINI_API_KEY in .env.',
      );
    }
    const directUrl = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
    res = await fetchWithRetry(directUrl, body, null);
  }
  const latency_ms = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new GeminiApiError(res.status, errText);
  }

  let raw: GeminiApiResponse;
  try {
    raw = (await res.json()) as GeminiApiResponse;
  } catch {
    throw new GeminiApiError(res.status, 'Response body was not valid JSON.');
  }

  if (raw.promptFeedback?.blockReason) {
    throw new GeminiBlockedError(raw.promptFeedback.blockReason);
  }

  const finishReason = raw.candidates?.[0]?.finishReason;
  const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GeminiApiError(0, `Empty response from Gemini (finishReason: ${finishReason ?? 'unknown'}).`);
  }

  // A response truncated at the token limit can still be valid-looking JSON
  // (e.g. a 7-day calendar that came back with 4 days), which would parse fine
  // and be silently trusted. Treat truncation/safety stops as errors.
  if (finishReason === 'MAX_TOKENS' || finishReason === 'SAFETY' || finishReason === 'RECITATION') {
    throw new GeminiApiError(0, `Gemini response was incomplete (finishReason: ${finishReason}).`);
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new GeminiParseError(text);
  }

  return { data, model_used: model, provider: 'google', latency_ms };
}

// ── Fetch with timeout + retry ───────────────────────────────────────────────

/**
 * POST to Gemini with a per-attempt timeout and bounded retries on transient
 * failures (network errors and 429/5xx). Non-retryable HTTP errors (e.g. 400,
 * 403) are returned as-is for the caller to surface. Throws GeminiNetworkError
 * only after exhausting retries.
 */
async function fetchWithRetry(
  url: string,
  body: GeminiRequestBody | Record<string, unknown>,
  authorization: string | null,
): Promise<Response> {
  let lastCause: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authorization) headers['Authorization'] = authorization;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      // Retry transient server statuses; return everything else immediately.
      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        lastCause = new GeminiApiError(res.status, 'transient');
        await sleep(1000 * 2 ** attempt); // 1s, 2s
        continue;
      }
      return res;
    } catch (cause) {
      // Includes AbortError (timeout) and network failures.
      lastCause = cause;
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new GeminiNetworkError('Network request to Gemini failed after retries.', lastCause);
}

// ── User-facing error mapping ─────────────────────────────────────────────────

/**
 * Map a Studio/Gemini error to a clean, user-facing message. The raw error
 * messages embed API response bodies and internal prefixes that shouldn't be
 * shown to a merchant — use this anywhere an error reaches the UI.
 */
export function friendlyGeminiMessage(err: unknown): string {
  if (err instanceof GeminiConfigError) {
    return 'AI features require sign-in and a deployed ai-proxy Edge Function.';
  }
  if (err instanceof GeminiNetworkError) {
    return 'Couldn’t reach the AI service. Check your connection and try again.';
  }
  if (err instanceof GeminiBlockedError) {
    return 'The request was blocked by the AI safety filter. Try rephrasing your input.';
  }
  if (err instanceof GeminiParseError) {
    return 'The AI returned an unexpected response. Please try again.';
  }
  if (err instanceof GeminiApiError) {
    if (err.statusCode === 429) {
      return 'The AI service is busy right now. Please try again in a moment.';
    }
    if (err.statusCode >= 500) {
      return 'The AI service had a temporary problem. Please try again.';
    }
    return 'The AI request failed. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

// ── Error classes ─────────────────────────────────────────────────────────────

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(`[Gemini] Config error: ${message}`);
    this.name = 'GeminiConfigError';
  }
}

export class GeminiNetworkError extends Error {
  readonly cause: unknown;
  constructor(message: string, cause: unknown) {
    super(`[Gemini] Network error: ${message}`);
    this.name = 'GeminiNetworkError';
    this.cause = cause;
  }
}

export class GeminiApiError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, body: string) {
    super(`[Gemini] API error ${statusCode}: ${body}`);
    this.name = 'GeminiApiError';
    this.statusCode = statusCode;
  }
}

export class GeminiBlockedError extends Error {
  readonly blockReason: string;
  constructor(blockReason: string) {
    super(`[Gemini] Prompt was blocked: ${blockReason}`);
    this.name = 'GeminiBlockedError';
    this.blockReason = blockReason;
  }
}

export class GeminiParseError extends Error {
  readonly raw: string;
  constructor(raw: string) {
    super(`[Gemini] Response was not valid JSON: ${raw.slice(0, 300)}`);
    this.name = 'GeminiParseError';
    this.raw = raw;
  }
}

// ── Internal request / response shapes ───────────────────────────────────────

interface GeminiRequestBody {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  generationConfig: {
    responseMimeType: string;
    responseSchema: Record<string, unknown>;
    temperature: number;
  };
  system_instruction?: { parts: Array<{ text: string }> };
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}
