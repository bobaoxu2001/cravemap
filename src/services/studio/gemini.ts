// ============================================================================
// CraveMap Studio — Gemini AI client
// ============================================================================
//
// SECURITY WARNING ⚠️
// EXPO_PUBLIC_* variables are inlined into the JavaScript bundle at build
// time and are therefore readable by anyone who downloads the app.
// This matches the existing project pattern (see EXPO_PUBLIC_OPENAI_API_KEY)
// and is acceptable for a hackathon / early-access build, but MUST be
// replaced before wide distribution.
//
// Migration path → Supabase Edge Function:
//   1. Create supabase/functions/studio-agent/index.ts
//   2. Move callGeminiStructured() there (GEMINI_API_KEY as a secret, not public)
//   3. Replace the fetch() call below with a call to your Edge Function URL
//   4. Remove EXPO_PUBLIC_GEMINI_API_KEY from .env and EAS secrets
//
// ============================================================================

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

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
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiConfigError(
      'EXPO_PUBLIC_GEMINI_API_KEY is not set. ' +
        'Add it to your .env file to enable CraveMap Studio AI features.',
    );
  }

  const model = opts.model ?? DEFAULT_MODEL;
  // Use header auth instead of `?key=` query string — keeps the key out of
  // URL logs / proxy access logs / error reporters. Gemini v1beta supports
  // both forms; header is the documented preferred form.
  const url = `${GEMINI_BASE}/${model}:generateContent`;

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
  let res: Response;

  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new GeminiNetworkError('Network request to Gemini failed.', cause);
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

  const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = raw.candidates?.[0]?.finishReason ?? 'unknown';
    throw new GeminiApiError(0, `Empty response from Gemini (finishReason: ${reason}).`);
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new GeminiParseError(text);
  }

  return { data, model_used: model, provider: 'google', latency_ms };
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

// ── Runtime validation ────────────────────────────────────────────────────────
//
// Gemini's responseSchema is best-effort — under load it occasionally omits
// required fields or returns nulls in place of arrays. Validate the shape at
// the boundary so downstream code can safely assume invariants.

export type FieldSpec =
  | { type: 'string' }
  | { type: 'array' }
  | { type: 'object' };

/**
 * Throws GeminiParseError if `data` is not an object or is missing any of the
 * required keys, or if any key fails its expected type check.
 *
 * Intentionally shallow: we only validate top-level invariants used by the
 * UI. Nested array items default to safe empties via the orchestrator's
 * read path, so we don't need a full schema validator here.
 */
export function assertGeminiShape(
  data: unknown,
  spec: Record<string, FieldSpec>,
  label: string,
): void {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new GeminiParseError(
      `${label}: expected a JSON object, got ${data === null ? 'null' : typeof data}`,
    );
  }
  const obj = data as Record<string, unknown>;
  for (const [key, fieldSpec] of Object.entries(spec)) {
    const value = obj[key];
    if (value === undefined || value === null) {
      throw new GeminiParseError(`${label}: missing required field "${key}"`);
    }
    if (fieldSpec.type === 'string' && typeof value !== 'string') {
      throw new GeminiParseError(`${label}: field "${key}" must be a string`);
    }
    if (fieldSpec.type === 'array' && !Array.isArray(value)) {
      throw new GeminiParseError(`${label}: field "${key}" must be an array`);
    }
    if (
      fieldSpec.type === 'object' &&
      (typeof value !== 'object' || Array.isArray(value))
    ) {
      throw new GeminiParseError(`${label}: field "${key}" must be an object`);
    }
  }
}
