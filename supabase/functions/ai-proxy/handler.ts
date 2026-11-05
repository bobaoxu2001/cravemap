type Environment = Record<string, string | undefined>;
type Fetcher = typeof fetch;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function boundedBody(request: Request, maximum: number): Promise<ArrayBuffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('empty');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new Error('oversized');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes.buffer;
}

/** Web-standard handler is separately testable without Deno, credentials or paid API calls. */
export function createHandler(env: Environment, fetcher: Fetcher = fetch) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const authorization = request.headers.get('authorization') ?? '';
    if (!/^Bearer \S+$/.test(authorization)) return json({ error: 'Sign in required' }, 401);
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return json({ error: 'AI service unavailable' }, 503);
    try {
      // Validate the token with Auth; do not trust decoded, unsigned JWT claims.
      const auth = await fetcher(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: authorization, apikey: env.SUPABASE_ANON_KEY },
        signal: AbortSignal.timeout(10_000),
      });
      if (!auth.ok) return json({ error: 'Sign in required' }, 401);
      const user = await auth.json();
      if (!user?.id || user.is_anonymous === true) return json({ error: 'Sign in required' }, 401);

      const contentType = request.headers.get('content-type') ?? '';
      let upstream: Response;
      if (contentType.includes('application/json')) {
        if (!env.GEMINI_API_KEY) return json({ error: 'Studio AI is not configured' }, 503);
        let payload;
        try { payload = JSON.parse(new TextDecoder().decode(await boundedBody(request, 64_000))); }
        catch { return json({ error: 'Invalid or oversized request' }, 400); }
        if (!Array.isArray(payload?.contents) || !payload.contents.length ||
            payload?.generationConfig?.responseMimeType !== 'application/json' ||
            !payload.generationConfig.responseSchema || typeof payload.generationConfig.responseSchema !== 'object') {
          return json({ error: 'Invalid Studio request' }, 400);
        }
        const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
        if (!/^[a-zA-Z0-9.-]+$/.test(model)) return json({ error: 'AI service unavailable' }, 503);
        upstream = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: JSON.stringify({
            contents: payload.contents,
            ...(payload.system_instruction ? { system_instruction: payload.system_instruction } : {}),
            generationConfig: { ...payload.generationConfig, maxOutputTokens: 4096, candidateCount: 1 },
          }),
          signal: AbortSignal.timeout(40_000),
        });
      } else if (contentType.includes('multipart/form-data')) {
        if (!env.OPENAI_API_KEY) return json({ error: 'Voice AI is not configured' }, 503);
        let form: FormData;
        try {
          const bytes = await boundedBody(request, 8_000_000);
          form = await new Response(bytes, { headers: { 'Content-Type': contentType } }).formData();
        } catch { return json({ error: 'Invalid or oversized recording' }, 400); }
        const file = form.get('file');
        if (!(file instanceof Blob) || !file.size) return json({ error: 'A recording is required' }, 400);
        const body = new FormData();
        body.append('file', file, 'voice.m4a');
        body.append('model', 'whisper-1');
        upstream = await fetcher('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body,
          signal: AbortSignal.timeout(40_000),
        });
      } else return json({ error: 'Unsupported request format' }, 415);
      // Provider error bodies can contain sensitive request details. Never relay them.
      if (!upstream.ok) return json({ error: 'AI provider request failed' }, upstream.status === 429 ? 429 : 502);
      return json(await upstream.json());
    } catch { return json({ error: 'AI service temporarily unavailable' }, 502); }
  };
}
