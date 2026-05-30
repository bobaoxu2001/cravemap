# CraveMap — Project Review

_Full-project review covering the app, services layer, business logic, AI
(Studio/Gemini) feature, and Supabase backend. Code-level fixes from this
review are committed on the `claude/project-review-yueci` branch; the
remaining items are a prioritized backlog._

## Score

| Area | Before | After | Notes |
|------|:------:|:-----:|-------|
| Architecture & structure | 8 | 8 | Clean dual mock/Supabase dispatcher pattern, typed services, Expo Router, CI typecheck. |
| Correctness / robustness | 5 | 8 | Fixed content-filter bypass, NaN ranking, new-user rewards crash, demo-data leakage, AI-output crashes. |
| Security | 4 | 5 | Client-bundled AI keys + RLS/schema issues remain (backlog); fail-closed RPCs and clean error surfacing added. |
| Data integrity (backend) | 4 | 4 | Dual conflicting schema lineages still need consolidation (backlog). |
| UX correctness | 6 | 8 | Consistent taste-match across screens, honest copy, friendly AI errors. |
| **Overall** | **6.5** | **8.0** | App/lib/service layer materially hardened; backend + key-exposure are the remaining ceiling. |

The remaining points are gated on backend work (schema consolidation, moving
AI keys to an Edge Function) that is intentionally **not** done on this
feature branch because it touches a possibly-live production schema.

## What was fixed (this branch)

1. **Content filter** — banned-word matching was a raw substring check,
   trivially bypassed by spacing (`n i g g e r`), punctuation, and leetspeak
   (`n1gg3r`, `f@ggot`). Added a collapsed/de-leeted matching pass and switched
   length counting to code points so emoji/CJK reviews aren't falsely rejected.
2. **Ranking math** — `scoreRestaurant` and proof strings now guard every
   numeric term against `NaN` from null DB fields, so the "Hungry Now" pick is
   deterministic. Capped the positive taste-match adjustment at +15 so
   well-tagged restaurants still differentiate instead of all saturating at 99.
3. **Rewards crash** — `getFoundingScoutProgress` used `.single()`, which
   throws for any brand-new user with no progress row; switched to
   `.maybeSingle()` with an all-false default.
4. **Demo-data leakage** — on a transient Supabase read failure for a logged-in
   user, `saved`/`rewards`/`invites` fell back to the **mock/demo user's** data,
   showing another account's saved list / rewards / invites as "yours." Now
   degrade to a neutral empty result; mock data is used only in explicit demo
   mode.
5. **Pet XP** — tolerate missing `foundingScoutProgress`/`checkInCount` instead
   of crashing the pet screen on partial profiles.
6. **Gemini client** — added a 45s request timeout (AbortController), retries on
   network/429/5xx with backoff, and rejection of truncated
   (`MAX_TOKENS`/`SAFETY`) responses that would otherwise be silently trusted.
7. **AI output safety** — partial Gemini responses (missing arrays) would
   white-screen the Studio result screens; added normalizers that coerce model
   output into a guaranteed-safe shape at the service boundary.
8. **Consistency & honesty** — voice results now use the personalized
   taste-match list (matching the rest of the app); Studio shows friendly error
   messages instead of raw API bodies; removed the hardcoded "247 other people"
   figure that was presented as a computed personalized fact.
9. **Fail-closed RPCs** — `block_user` / `report_check_in` treated a null/
   malformed RPC payload as success; now require `success === true`.

## Backlog (not done here — higher risk / backend)

### Critical
- **AI keys are bundled into the client binary.** `EXPO_PUBLIC_GEMINI_API_KEY`
  (and the OpenAI/Whisper key) ship in the JS bundle and can be extracted and
  abused. The migration path is documented in `gemini.ts` — move the calls
  behind a Supabase Edge Function with the key as a server secret, and drop the
  migration-004 client-INSERT policies on the AI tables.
- **Two conflicting Supabase schema lineages.** `supabase/schema.sql` (+
  `seed.sql`, `storage.sql`) and `supabase/migrations/001–004` define the same
  objects with divergent shapes (notably `founding_scout_progress` as a **view**
  vs a **table**). Pick one source of truth and delete the other; the
  migration lineage is the more consistent one.

### High
- **RLS leaks via `USING (true)`** in the `schema.sql` lineage —
  `founding_scout_progress` (view, no RLS) and `helpful_select_all` expose
  per-user data to everyone. Keep the `_own` policies from migration 001.
- **Silent-failure writes** — `merchant_payments` (and AI tables pre-004) have
  RLS enabled but no writer policy and no Edge Function in the repo to write via
  service role. Wire up the webhook/service-role path or document it.
- **Invite/redeem policy divergence** — the `schema.sql` invite SELECT policy
  hides redeemed invites from the redeemer, and its `redeem_invite` lacks the
  `FOR UPDATE` race guard the migration version has.

### Medium
- **Prompt injection / unverified claims** — merchant menu text is interpolated
  into Gemini prompts and the output (incl. `marketingClaims`,
  `health_positioning`) is rendered verbatim. Add a "verify before use"
  disclaimer and tell the model the menu block is untrusted data.
- **Report moderation loop** — `reports` has reporter insert/select only; no
  admin/service path to action reports (App Store UGC compliance needs one).
- **Duplicate seeders** — `seed.sql` and `seed/seed_restaurants.mjs` use
  different slugs/IDs for the same restaurants; running both creates duplicates.
  Keep the UUID-stable `seed.sql`.
- **Taste-match base default** — `transforms.ts` defaults missing
  `local_approved_percent` to 0 (→ "3% match") while `computeTasteMatch` assumes
  70; pick one canonical default in `restaurantFromRow`.

### Low
- Committed test/demo login credentials in `supabase/beta-test` and
  `supabase/release` — rotate/disable after launch.
- Loosely-typed Supabase row casts (`as unknown as XRow`) throughout the
  service layer — adopt the generated `Database` type for the client.
- Dead exports (`isBlocked`, `hasReported`, eager `supabase` singleton) and a
  mock/Supabase signature mismatch on `updateTastePassport`.
