import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHandler } from '../supabase/functions/ai-proxy/handler.ts';

const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-test', GEMINI_API_KEY: 'private-test-key' };
const payload = { contents: [{ role: 'user', parts: [{ text: 'menu' }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'object' } } };
const request = (body = payload) => new Request('https://local/ai-proxy', { method: 'POST', headers: { Authorization: 'Bearer user-session', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const auth = () => Response.json({ id: 'user-1' });

test('rejects a missing session before calling Auth or the provider', async () => {
  const handler = createHandler(env, () => { throw new Error('must not call'); });
  assert.equal((await handler(new Request('https://local', { method: 'POST' }))).status, 401);
});
test('refuses an invalid token and anonymous Auth users before paid inference', async () => {
  for (const response of [new Response(null, { status: 401 }), Response.json({ id: 'anonymous', is_anonymous: true })]) {
    let calls = 0;
    const handler = createHandler(env, async () => { calls++; return response; });
    assert.equal((await handler(request())).status, 401);
    assert.equal(calls, 1);
  }
});
test('places the private provider key only on the upstream request', async () => {
  let calls = 0;
  const handler = createHandler(env, async (url, options) => {
    if (++calls === 1) return auth();
    assert.equal(options.headers['x-goog-api-key'], 'private-test-key');
    assert.ok(!url.includes('private-test-key'));
    const forwarded = JSON.parse(options.body);
    assert.equal(forwarded.generationConfig.maxOutputTokens, 4096);
    return Response.json({ candidates: [] });
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.ok(!(await response.text()).includes('private-test-key'));
});
test('redacts upstream errors and bounds real body bytes without Content-Length', async () => {
  let calls = 0;
  const handler = createHandler(env, async () => ++calls === 1 ? auth() : new Response('private-test-key', { status: 500 }));
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('private-test-key'));
  const bounded = createHandler(env, async () => auth());
  assert.equal((await bounded(request({ ...payload, extra: 'x'.repeat(64_001) }))).status, 400);
});
test('rejects malformed contracts and handles provider network failures', async () => {
  assert.equal((await createHandler(env, async () => auth())(request({}))).status, 400);
  let calls = 0;
  const response = await createHandler(env, async () => {
    if (++calls === 1) return auth();
    throw new Error('private provider context');
  })(request());
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('private provider context'));
});
