// CraveMap AI Proxy — Supabase Edge Function
//
// Keeps GEMINI_API_KEY and OPENAI_API_KEY as Deno secrets so they are never
// bundled into the client JS. Every request is verified against the caller's
// Supabase JWT before the upstream API is touched.
//
// Deploy:
//   supabase functions deploy ai-proxy --no-verify-jwt
//   supabase secrets set GEMINI_API_KEY=<key> OPENAI_API_KEY=<key>
//
// Routes (discriminated by JSON field "type"):
//   { type: "gemini",  model, contents, generationConfig, system_instruction? }
//   { type: "whisper", audioBase64, mimeType? }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, corsResponse } from '../_shared/cors.ts';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function verifyUser(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  return !error && user !== null;
}

// ─── Gemini proxy ─────────────────────────────────────────────────────────────

async function handleGemini(body: Record<string, unknown>): Promise<Response> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return corsResponse(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on this server.' }), 503);
  }

  const model = (body.model as string | undefined) ?? 'gemini-2.0-flash';
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

  const geminiPayload = {
    contents: body.contents,
    generationConfig: body.generationConfig,
    ...(body.system_instruction ? { system_instruction: body.system_instruction } : {}),
  };

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiPayload),
    signal: AbortSignal.timeout(55_000),
  });

  // Forward the exact status code so the client retry/error logic works unchanged.
  const upstreamBody = await upstream.text();
  return new Response(upstreamBody, {
    status: upstream.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Whisper proxy ────────────────────────────────────────────────────────────

async function handleWhisper(body: Record<string, unknown>): Promise<Response> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return corsResponse(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on this server.' }), 503);
  }

  const audioBase64 = body.audioBase64 as string | undefined;
  if (!audioBase64) {
    return corsResponse(JSON.stringify({ error: 'audioBase64 is required.' }), 400);
  }

  // Decode base64 → binary
  const binaryStr = atob(audioBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const mimeType = (body.mimeType as string | undefined) ?? 'audio/m4a';
  const blob = new Blob([bytes], { type: mimeType });

  const formData = new FormData();
  formData.append('file', blob, 'voice.m4a');
  formData.append('model', 'whisper-1');

  const upstream = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(30_000),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => 'unknown');
    return corsResponse(JSON.stringify({ error: `Whisper API error ${upstream.status}`, detail: errText }), upstream.status);
  }

  const json = (await upstream.json()) as { text?: unknown };
  if (typeof json?.text !== 'string') {
    return corsResponse(JSON.stringify({ error: 'Unexpected Whisper response shape.' }), 502);
  }

  return corsResponse(JSON.stringify({ transcript: json.text }));
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return corsResponse(JSON.stringify({ error: 'Method not allowed.' }), 405);
  }

  // Verify the caller is an authenticated CraveMap user.
  const authenticated = await verifyUser(req.headers.get('Authorization'));
  if (!authenticated) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized.' }), 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Request body must be valid JSON.' }), 400);
  }

  const { type } = body;

  if (type === 'gemini') return handleGemini(body);
  if (type === 'whisper') return handleWhisper(body);

  return corsResponse(JSON.stringify({ error: `Unknown type "${type}". Expected "gemini" or "whisper".` }), 400);
});
