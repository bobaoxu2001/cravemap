-- ============================================================================
-- CraveMap / 好吃GO — Beta Test Users (Tester1, Tester2, Tester3)
-- ============================================================================
-- Apply AFTER schema.sql, seed.sql, storage.sql.
-- Requires SERVICE_ROLE (uses auth.admin functions).
-- Safe to re-run: ON CONFLICT clauses skip duplicates.
-- ============================================================================
--
-- These users are created directly via the admin API so the `handle_new_user`
-- trigger fires and creates their profile row automatically. We then UPDATE
-- the profile to populate the taste passport and mark it complete.
--
-- Test emails (using +beta tags so a single inbox can catch confirmations):
--   tester1+beta@cravemap.app  →  password: TestPass123!
--   tester2+beta@cravemap.app  →  password: TestPass123!
--   tester3+beta@cravemap.app  →  password: TestPass123!
-- ============================================================================

-- Tester 1 — NYC, Spicy Adventurer
select auth.admin_create_user(
  email      => 'tester1+beta@cravemap.app',
  password   => 'TestPass123!',
  email_confirm => true,
  user_meta_data => jsonb_build_object('name', 'Alex Chen (Tester1)')
) where not exists (
  select 1 from auth.users where email = 'tester1+beta@cravemap.app'
);

-- Tester 2 — LA, Healthy Foodie
select auth.admin_create_user(
  email      => 'tester2+beta@cravemap.app',
  password   => 'TestPass123!',
  email_confirm => true,
  user_meta_data => jsonb_build_object('name', 'Mei Lin (Tester2)')
) where not exists (
  select 1 from auth.users where email = 'tester2+beta@cravemap.app'
);

-- Tester 3 — Bay Area, Comfort Seeker
select auth.admin_create_user(
  email      => 'tester3+beta@cravemap.app',
  password   => 'TestPass123!',
  email_confirm => true,
  user_meta_data => jsonb_build_object('name', 'David Park (Tester3)')
) where not exists (
  select 1 from auth.users where email = 'tester3+beta@cravemap.app'
);

-- ----------------------------------------------------------------------------
-- Note: If `auth.admin_create_user` is not exposed in your Postgres function
-- catalog (some Supabase versions expose it only via the REST admin API),
-- create the three users from the Supabase Dashboard → Authentication → Users
-- → "Add user" → Create new user. Then continue with the UPDATE statements
-- below.
-- ----------------------------------------------------------------------------

-- Populate Tester1 taste passport (NYC · Spicy Adventurer)
update public.profiles set
  name = 'Alex Chen',
  avatar_url = 'https://picsum.photos/seed/avatar_alex_main/200/200',
  city = 'New York City',
  trust_sources = array['Locals', 'Same culture', 'Similar taste', 'Verified visits'],
  taste_preferences = array['Spicy', 'Savory', 'Umami', 'Bold Flavor'],
  dislikes = array['Too Sweet', 'Touristy', 'Overhyped'],
  diet_needs = array[]::text[],
  food_scenes = array['Cheap Eats', 'Late-Night', 'Solo Dining', 'Study Cafe'],
  taste_passport_complete = true,
  persona = '🌶️ Spicy Adventurer'
where id = (select id from auth.users where email = 'tester1+beta@cravemap.app');

-- Populate Tester2 taste passport (LA · Healthy Foodie)
update public.profiles set
  name = 'Mei Lin',
  avatar_url = 'https://picsum.photos/seed/avatar_mei/200/200',
  city = 'Los Angeles',
  trust_sources = array['Same culture', 'Similar taste'],
  taste_preferences = array['Fresh', 'Light', 'Umami', 'Aromatic'],
  dislikes = array['Greasy', 'Heavy'],
  diet_needs = array['Vegan'],
  food_scenes = array['Brunch', 'Date Night', 'Healthy'],
  taste_passport_complete = true,
  persona = '🥗 Healthy Foodie'
where id = (select id from auth.users where email = 'tester2+beta@cravemap.app');

-- Populate Tester3 taste passport (Bay Area · Comfort Seeker)
update public.profiles set
  name = 'David Park',
  avatar_url = 'https://picsum.photos/seed/avatar_david_t3/200/200',
  city = 'Bay Area',
  trust_sources = array['Locals', 'Verified visits'],
  taste_preferences = array['Comfort', 'Savory', 'Smoky', 'Rich'],
  dislikes = array['Bitter'],
  diet_needs = array[]::text[],
  food_scenes = array['Family Dinner', 'Work Lunch', 'Quick Lunch'],
  taste_passport_complete = true,
  persona = '🍜 Comfort Seeker'
where id = (select id from auth.users where email = 'tester3+beta@cravemap.app');

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
-- select email, p.name, p.city, p.persona, p.taste_passport_complete
-- from auth.users u join public.profiles p on p.id = u.id
-- where email like 'tester%+beta@cravemap.app'
-- order by email;
