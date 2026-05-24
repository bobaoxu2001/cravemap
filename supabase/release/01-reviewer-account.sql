-- ============================================================================
-- CraveMap / 好吃GO — Apple App Review Demo Account
-- ============================================================================
-- Apply AFTER schema.sql, seed.sql, storage.sql, and migrations 001+002.
-- Requires SERVICE_ROLE (uses auth.admin functions).
-- Safe to re-run: ON CONFLICT clauses skip duplicates.
-- ============================================================================
--
-- Why this exists:
--   Apple App Review needs a working login to evaluate the app. Without a
--   pre-seeded demo account that has a completed Taste Passport and visible
--   check-ins, reviewers see empty feeds and reject for Guideline 4.2
--   ("minimum functionality").
--
-- After running this file, paste these credentials into App Store Connect →
-- App Review Information → Demo Account:
--
--   Email:    reviewer@cravemap-test.com
--   Password: ReviewPass2026!
--
-- Apply 02-launch-checkins.sql next to give the reviewer (and all users) a
-- baseline of check-in activity to browse.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create the auth user (triggers handle_new_user → creates profile row)
-- ----------------------------------------------------------------------------
select auth.admin_create_user(
  email         => 'reviewer@cravemap-test.com',
  password      => 'ReviewPass2026!',
  email_confirm => true,
  user_meta_data => jsonb_build_object('name', 'App Review')
) where not exists (
  select 1 from auth.users where email = 'reviewer@cravemap-test.com'
);

-- ----------------------------------------------------------------------------
-- Complete the reviewer's Taste Passport so the app skips onboarding and
-- they land directly on the populated Home tab.
-- ----------------------------------------------------------------------------
do $$
declare
  reviewer_id uuid := (select id from auth.users where email = 'reviewer@cravemap-test.com');
begin
  if reviewer_id is null then
    raise notice 'Reviewer auth user missing — auth.admin_create_user may not be exposed. Create the user manually in Supabase Dashboard → Authentication, then re-run.';
    return;
  end if;

  update public.profiles set
    name                    = 'App Review',
    city                    = 'New York City',
    trust_sources           = array['Locals','Same culture','Similar taste','Verified visits']::text[],
    taste_preferences       = array['Spicy','Savory','Umami','Bold Flavor']::text[],
    dislikes                = array['Too Sweet','Touristy']::text[],
    diet_needs              = array[]::text[],
    food_scenes             = array['Cheap Eats','Date Night','Late-Night','Solo Dining']::text[],
    persona                 = 'Spicy Adventurer',
    taste_passport_complete = true
  where id = reviewer_id;

  -- Seed a handful of saved restaurants so the Saved tab is non-empty.
  insert into public.saved_restaurants (user_id, restaurant_id) values
    (reviewer_id, '00000000-0000-4000-8000-000000000001'), -- Xi'an Famous Foods
    (reviewer_id, '00000000-0000-4000-8000-000000000003'), -- White Bear
    (reviewer_id, '00000000-0000-4000-8000-000000000005'), -- Spicy Village
    (reviewer_id, '00000000-0000-4000-8000-000000000009'), -- Ugly Baby
    (reviewer_id, '00000000-0000-4000-8000-000000000010')  -- Birria-Landia
  on conflict (user_id, restaurant_id) do nothing;
end $$;

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
-- select email, p.name, p.city, p.persona, p.taste_passport_complete, p.saved_count
-- from auth.users u join public.profiles p on p.id = u.id
-- where email = 'reviewer@cravemap-test.com';
