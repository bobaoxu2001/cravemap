-- ============================================================================
-- CraveMap / 好吃GO — Cross-User Invite Redemption Test
-- ============================================================================
-- This is a *test script* — verifies the full invite flow against real RPCs
-- and triggers. Run section-by-section in the Supabase SQL Editor and check
-- the output after each step.
--
-- Setup prerequisites:
--   1. 01-beta-users.sql applied (Tester1 + Tester2 exist)
--   2. 02-beta-content.sql applied
--   3. Both testers have signed in once via the app (refresh tokens present)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Step 1 — Resolve UUIDs
-- ---------------------------------------------------------------------------
\set tester1_email '\'tester1+beta@cravemap.app\''
\set tester2_email '\'tester2+beta@cravemap.app\''

-- Confirm both exist
select email, id from auth.users where email in
  (:tester1_email, :tester2_email)
order by email;

-- ---------------------------------------------------------------------------
-- Step 2 — Tester1 creates an invite
-- ---------------------------------------------------------------------------
-- In the app: Profile → Invite Friends. The client calls createInvite()
-- which inserts a row with inviter_id = auth.uid() and a CRAVE-XXXXXX code.
-- We simulate that here by inserting directly. (App-side INSERT respects
-- the RLS policy `invites_insert_own` which requires auth.uid() = inviter_id.)

-- Capture inviter id
do $$
declare
  t1 uuid := (select id from auth.users where email = 'tester1+beta@cravemap.app');
  new_code text := 'CRAVE-' || upper(substring(md5(random()::text) for 6));
begin
  insert into public.invites (inviter_id, code) values (t1, new_code);
  raise notice 'Tester1 invite code: %', new_code;
end $$;

-- Show the new invite
select id, inviter_id, code, accepted_at
from public.invites
where inviter_id = (select id from auth.users where email = 'tester1+beta@cravemap.app')
order by created_at desc limit 1;

-- ---------------------------------------------------------------------------
-- Step 3 — Tester2 redeems via redeem_invite RPC
-- ---------------------------------------------------------------------------
-- The RPC is security-definer and uses auth.uid() to identify the redeemer.
-- From the SQL editor we can't set auth.uid(), so we simulate two ways:
--
-- A) Use the app: sign in as Tester2, paste the code on Profile → Redeem.
--    Verify the response { success: true }.
--
-- B) Simulate from SQL by setting the JWT claim. Requires Postgres role
--    with `set_config` permission (works in the Supabase SQL Editor under
--    service-role auth).

-- Set the auth context to Tester2
select set_config(
  'request.jwt.claim.sub',
  (select id::text from auth.users where email = 'tester2+beta@cravemap.app'),
  true  -- transaction-local
);

-- Grab the invite code Tester1 just created
do $$
declare
  code_to_redeem text := (
    select code from public.invites
    where inviter_id = (select id from auth.users where email = 'tester1+beta@cravemap.app')
    order by created_at desc limit 1
  );
  result jsonb;
begin
  select redeem_invite(code_to_redeem) into result;
  raise notice 'Redeem result: %', result;
end $$;

-- ---------------------------------------------------------------------------
-- Step 4 — Verify trigger side-effects
-- ---------------------------------------------------------------------------

-- (a) invites row updated with accepted_at + accepted_by_user_id
select id, inviter_id, code, accepted_at, accepted_by_user_id
from public.invites
where inviter_id = (select id from auth.users where email = 'tester1+beta@cravemap.app')
order by created_at desc limit 1;
-- Expected: accepted_at is non-null, accepted_by_user_id = Tester2's UUID

-- (b) Tester1's invite_count bumped by 1 (via bump_invite_count_on_accept trigger)
select email, p.invite_count
from auth.users u join public.profiles p on p.id = u.id
where email = 'tester1+beta@cravemap.app';
-- Expected: invite_count >= 1

-- (c) Tester1's founding_scout_progress now shows 2/4 (or 3/4 if other tasks met)
select * from public.founding_scout_progress
where user_id = (select id from auth.users where email = 'tester1+beta@cravemap.app');
-- Expected columns: taste_passport=true, three_check_ins=true (from seed),
-- verified_check_in=true (from seed), two_invites=false (only 1 invite accepted)

-- ---------------------------------------------------------------------------
-- Step 5 — Negative tests
-- ---------------------------------------------------------------------------

-- (a) Tester2 tries to redeem the SAME code again → "already_redeemed"
do $$
declare
  code_to_redeem text := (
    select code from public.invites
    where inviter_id = (select id from auth.users where email = 'tester1+beta@cravemap.app')
    order by created_at desc limit 1
  );
  result jsonb;
begin
  select redeem_invite(code_to_redeem) into result;
  raise notice 'Re-redeem result (should be error): %', result;
end $$;

-- (b) Tester1 tries to redeem his OWN code → "self_invite"
select set_config(
  'request.jwt.claim.sub',
  (select id::text from auth.users where email = 'tester1+beta@cravemap.app'),
  true
);

do $$
declare
  -- Create a fresh code for Tester1 to attempt redemption on
  fresh_code text := 'CRAVE-' || upper(substring(md5(random()::text) for 6));
  t1 uuid := (select id from auth.users where email = 'tester1+beta@cravemap.app');
  result jsonb;
begin
  insert into public.invites (inviter_id, code) values (t1, fresh_code);
  select redeem_invite(fresh_code) into result;
  raise notice 'Self-invite result (should be error): %', result;
end $$;

-- (c) Invalid code format → "not_found"
do $$
declare
  result jsonb;
begin
  select redeem_invite('NOT-A-CODE') into result;
  raise notice 'Bad code result (should be error): %', result;
end $$;
