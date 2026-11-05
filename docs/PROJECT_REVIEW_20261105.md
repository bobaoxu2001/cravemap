# Project review — 2026-11-05

## Corrected

- Integrated the 15 upstream commits with the local Studio, auth and evidence work.
- Kept local output validation alongside upstream nested-output normalization.
- Removed private AI provider keys from Expo public variables and added an Auth-verified Supabase proxy, request-size limits, bounded upstream timeouts and redacted errors.
- Replaced the unverified 847/153 enrollment claim with neutral beta copy.
- Made client payment reports pending. Verified revenue requires a trusted success plus verified_at, and currencies are not summed together.
- Added migration 007 to preserve owner RLS in the evidence RPC.
- Patched high/critical dependency findings while retaining SDK 54; included an explicit Metro byte-input compatibility patch for image-size 2.
- Added offline Auth/proxy, revenue and real-image decoding regression tests.

## Validation

TypeScript, eight offline tests, clean lockfile resolution, and an Expo web export passed. Production dependency audit reports zero high/critical findings; 13 lower-severity SDK/tooling findings remain. Native device builds, hosted Supabase migration behavior, payment-provider webhook verification and an actual paid AI call were not verified.

## Deployment boundary

This review uploads code. It does not deploy Supabase functions/migrations, enable paid inference, verify a payment or publish a native app. Apply migration 007 before using the revised payment/evidence screens. Configure server-only credentials and per-user quotas before enabling inference.

The `beta-tester-*` branches are historical test snapshots; the reviewed current source is `codex/project-review-20261105`.
