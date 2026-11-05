# Production backend deployment — 2026-11-05

Target: `cravemap-prod` (`dxbagdyiujnlosppdmql`). The paused project was restored
and its dashboard returned Healthy. The existing diner schema was retained.

## Deployed

- Studio migrations **003–007**, applied together in one transaction. All seven
  Studio tables have row-level security enabled.
- `get_studio_evidence()` uses the caller's permissions; anonymous execution is
  denied. Revenue includes only the owner's verified, succeeded USD payments.
- `ai-proxy` Edge Function, deployed with JWT verification enabled. The handler
  also validates the user's session with Supabase Auth and rejects anonymous users.
- Applied files 003–007 are recorded in the standard migration history table.
  The direct PostgreSQL connection timed out, so deployment and history recording
  used the authenticated Management API through Supabase CLI 3.0.0.

Migrations 001–002 were already represented by the manually provisioned diner
schema and were **not replayed or newly marked as applied**. Review that baseline
before a future blanket `db push`; do not infer that every historical SQL file
was executed by this deployment.

## Verified on production

`supabase/tests/studio_security.sql` uses transactional fixtures and rolls them
back. It passed checks for merchant isolation across logs/campaigns/evidence,
verified USD revenue, allowed owner-pending writes, rejection of self-certified
or cross-owner payments, inability to update verification, and anonymous RPC denial.

HTTP checks passed for CORS, missing/invalid/anon credentials, real password sign-in
and the authenticated evidence RPC. The temporary verification account was deleted.
No customer account or financial transaction was used as a test fixture.

## Remaining configuration

At verification time the project had **no Gemini or OpenAI provider secrets**.
A valid signed-in request reached the proxy and received the intended `503`
configuration response. This verifies authentication and the configuration guard;
it does **not** establish successful live AI generation.

Configure `GEMINI_API_KEY` in this project's Edge Function secrets for Studio AI,
and `OPENAI_API_KEY` only if enabling speech. Keep provider keys off the client.
After a successful authenticated provider smoke test, enable the corresponding
public feature flag and rebuild the app. The existing app remains in demo mode.
Real payment-provider/webhook verification is a separate integration; a pending
client record is not verified revenue.

## Re-run database security checks

Use an authenticated Supabase CLI with access to this exact project:

```sh
npm exec --yes --package=supabase@3.0.0 -- supabase db query \
  --remote=dxbagdyiujnlosppdmql \
  --file supabase/tests/studio_security.sql --yes
```

The SQL creates temporary fixture accounts/rows inside a transaction and rolls
all of them back. It does not send signup email or write real payment results.
