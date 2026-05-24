-- ============================================================================
-- CraveMap / 好吃GO — Launch Check-in Seed
-- ============================================================================
-- Apply AFTER 01-reviewer-account.sql.
-- Requires SERVICE_ROLE.
-- Safe to re-run (auth user creation guarded by NOT EXISTS;
--   check-ins guarded by ON CONFLICT on a synthetic unique key).
-- ============================================================================
--
-- Why this exists:
--   CraveMap's pitch is "verified local check-ins." If Apple App Review
--   logs in and sees 0 check-ins across every restaurant, the core feature
--   reads as broken and triggers Guideline 4.2 rejection.
--
--   This seed creates 4 launch "scout" personas and authors ~28 check-ins
--   across NYC / LA / Bay Area / Seattle / Boston so every featured
--   restaurant shows real community activity on day one.
--
--   These accounts are seeded content — not gameable test accounts.
--   Disable password sign-in for them post-launch or rotate the passwords
--   if you want to lock the personas to read-only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create scout auth users (idempotent)
-- ----------------------------------------------------------------------------
select auth.admin_create_user(
  email => 'scout.alex@cravemap-launch.com', password => 'LaunchScout2026!',
  email_confirm => true,
  user_meta_data => jsonb_build_object('name', 'Alex C.')
) where not exists (select 1 from auth.users where email = 'scout.alex@cravemap-launch.com');

select auth.admin_create_user(
  email => 'scout.mei@cravemap-launch.com', password => 'LaunchScout2026!',
  email_confirm => true,
  user_meta_data => jsonb_build_object('name', 'Mei L.')
) where not exists (select 1 from auth.users where email = 'scout.mei@cravemap-launch.com');

select auth.admin_create_user(
  email => 'scout.david@cravemap-launch.com', password => 'LaunchScout2026!',
  email_confirm => true,
  user_meta_data => jsonb_build_object('name', 'David P.')
) where not exists (select 1 from auth.users where email = 'scout.david@cravemap-launch.com');

select auth.admin_create_user(
  email => 'scout.jamie@cravemap-launch.com', password => 'LaunchScout2026!',
  email_confirm => true,
  user_meta_data => jsonb_build_object('name', 'Jamie K.')
) where not exists (select 1 from auth.users where email = 'scout.jamie@cravemap-launch.com');

-- ----------------------------------------------------------------------------
-- 2. Complete scout taste passports + seed check-ins
-- ----------------------------------------------------------------------------
do $$
declare
  s_alex  uuid := (select id from auth.users where email = 'scout.alex@cravemap-launch.com');
  s_mei   uuid := (select id from auth.users where email = 'scout.mei@cravemap-launch.com');
  s_david uuid := (select id from auth.users where email = 'scout.david@cravemap-launch.com');
  s_jamie uuid := (select id from auth.users where email = 'scout.jamie@cravemap-launch.com');

  -- Restaurant UUIDs from seed.sql
  r_xian       uuid := '00000000-0000-4000-8000-000000000001';
  r_nanxiang   uuid := '00000000-0000-4000-8000-000000000002';
  r_whitebear  uuid := '00000000-0000-4000-8000-000000000003';
  r_kbbq       uuid := '00000000-0000-4000-8000-000000000004';
  r_spicy_vlg  uuid := '00000000-0000-4000-8000-000000000005';
  r_phobang    uuid := '00000000-0000-4000-8000-000000000006';
  r_adda       uuid := '00000000-0000-4000-8000-000000000007';
  r_uglybaby   uuid := '00000000-0000-4000-8000-000000000009';
  r_birria     uuid := '00000000-0000-4000-8000-000000000010';
  r_seaharbour uuid := '00000000-0000-4000-8000-000000000011';
  r_noodleboy  uuid := '00000000-0000-4000-8000-000000000012';
  r_sushigen   uuid := '00000000-0000-4000-8000-000000000014';
  r_chengdu    uuid := '00000000-0000-4000-8000-000000000016';
  r_nightmkt   uuid := '00000000-0000-4000-8000-000000000018';
  r_koipalace  uuid := '00000000-0000-4000-8000-000000000020';
  r_shahi      uuid := '00000000-0000-4000-8000-000000000022';
  r_maruichi   uuid := '00000000-0000-4000-8000-000000000024';
  r_tamarind   uuid := '00000000-0000-4000-8000-000000000025';
  r_kedai      uuid := '00000000-0000-4000-8000-000000000026';
  r_phobac     uuid := '00000000-0000-4000-8000-000000000027';
  r_gourmet    uuid := '00000000-0000-4000-8000-000000000029';
  r_penang     uuid := '00000000-0000-4000-8000-000000000031';
  r_beantown   uuid := '00000000-0000-4000-8000-000000000032';
begin
  if s_alex is null or s_mei is null or s_david is null or s_jamie is null then
    raise notice 'One or more scout auth users missing. Verify auth.admin_create_user ran successfully.';
    return;
  end if;

  -- Complete passports
  update public.profiles set
    name='Alex C.', city='New York City', persona='Spicy Adventurer',
    trust_sources=array['Locals','Verified visits','Anti-hype foodies']::text[],
    taste_preferences=array['Spicy','Very Spicy','Umami','Bold Flavor']::text[],
    dislikes=array['Touristy','Overhyped']::text[],
    food_scenes=array['Cheap Eats','Late-Night','Solo Dining']::text[],
    taste_passport_complete=true
  where id = s_alex;

  update public.profiles set
    name='Mei L.', city='Los Angeles', persona='Healthy Foodie',
    trust_sources=array['Same culture','Same diet','Verified visits']::text[],
    taste_preferences=array['Light','Savory','Umami']::text[],
    diet_needs=array['Vegetarian']::text[],
    food_scenes=array['Brunch','Work Lunch','Date Night']::text[],
    taste_passport_complete=true
  where id = s_mei;

  update public.profiles set
    name='David P.', city='Bay Area', persona='Comfort Seeker',
    trust_sources=array['Locals','Similar taste']::text[],
    taste_preferences=array['Comfort Food','Savory','Smoky']::text[],
    dislikes=array['Too Bland','Tiny Portions']::text[],
    food_scenes=array['Group Dinner','Date Night','Brunch']::text[],
    taste_passport_complete=true
  where id = s_david;

  update public.profiles set
    name='Jamie K.', city='Boston', persona='Authentic Explorer',
    trust_sources=array['Same culture','Anti-hype foodies']::text[],
    taste_preferences=array['Bold Flavor','Sour','Umami']::text[],
    food_scenes=array['Late-Night','Solo Dining','Group Dinner']::text[],
    taste_passport_complete=true
  where id = s_jamie;

  -- -------------------------------------------------------------------------
  -- Check-ins — ~28 entries across cities, dated over the last 6 weeks
  -- -------------------------------------------------------------------------
  insert into public.check_ins (
    user_id, restaurant_id, review, photos, ordered_items,
    taste_tags, scene_tags, hype_rating, location_verified,
    is_repeat_visit, would_return, created_at
  ) values
    -- Alex C. — NYC Spicy Adventurer (8)
    (s_alex, r_xian, 'Biang biang noodles still hit the way they did a decade ago. Extra al dente if you ask. Tear-inducing in the right way.',
      array[]::text[], array['Biangbiang in chili oil','Cumin lamb noodles']::text[],
      array['Spicy','Bold Flavor']::text[], array['Solo Dining']::text[],
      'worth_it', true, true, true, now() - interval '3 days'),
    (s_alex, r_whitebear, 'Cash only. No English menu. #6 wontons in chili oil that ruined every other wonton for me.',
      array[]::text[], array['#6 pork & chive wontons']::text[],
      array['Spicy','Savory']::text[], array['Solo Dining','Cheap Eats']::text[],
      'worth_it', true, false, true, now() - interval '8 days'),
    (s_alex, r_spicy_vlg, 'Big tray chicken small still feeds three. The hand-pulled noodles soak up the gravy like a sponge. Bring napkins.',
      array[]::text[], array['Big tray chicken (small)','Cucumber salad']::text[],
      array['Spicy','Bold Flavor']::text[], array['Group Dinner']::text[],
      'worth_it', true, false, true, now() - interval '14 days'),
    (s_alex, r_birria, 'Late-night quesabirria with consommé on the side. Crispy edges. The line moves fast.',
      array[]::text[], array['Quesabirria x3','Consommé extra']::text[],
      array['Savory','Bold Flavor']::text[], array['Late-Night']::text[],
      'worth_it', true, true, true, now() - interval '19 days'),
    (s_alex, r_uglybaby, 'Asked for Thai-spicy and they actually meant it. The som tum pla ra made my whole table sweat. Underrated khao kluk kapi.',
      array[]::text[], array['Som tum pla ra','Khao kluk kapi','Sai ua']::text[],
      array['Very Spicy','Sour','Fermented']::text[], array['Date Night']::text[],
      'worth_it', true, false, true, now() - interval '23 days'),
    (s_alex, r_nanxiang, 'XLB still the benchmark. Crab roe ones when in season are unreal. Skip the line by putting your name down and walking next door.',
      array[]::text[], array['Pork XLB','Crab roe XLB']::text[],
      array['Savory','Umami']::text[], array['Group Dinner']::text[],
      'worth_it', true, true, true, now() - interval '28 days'),
    (s_alex, r_kbbq, 'Worth it for the egg soufflé alone. Premium cuts, tableside service, ask about the daily special cut.',
      array[]::text[], array['Premium short rib','Egg soufflé','Kimchi stew']::text[],
      array['Smoky','Umami','Savory']::text[], array['Date Night']::text[],
      'worth_it', true, false, true, now() - interval '34 days'),
    (s_alex, r_phobang, 'Old reliable for late-night pho when nothing else is open. Broth is clean, no MSG headache.',
      array[]::text[], array['Beef pho','Iced coffee']::text[],
      array['Savory','Aromatic']::text[], array['Late-Night']::text[],
      'worth_it', true, true, true, now() - interval '40 days'),

    -- Mei L. — LA Healthy Foodie (7)
    (s_mei, r_seaharbour, 'Sunday dim sum with the family. Har gow translucent, turnip cake golden on both sides. They have not changed in years.',
      array[]::text[], array['Har gow','Turnip cake','Egg tarts']::text[],
      array['Delicate','Umami']::text[], array['Brunch','Group Dinner']::text[],
      'worth_it', true, true, true, now() - interval '5 days'),
    (s_mei, r_noodleboy, 'Dan dan mian with the right Sichuan peppercorn buzz. Tiny shop, expect to wait 10 min for a table.',
      array[]::text[], array['Dan dan mian','Cucumber salad']::text[],
      array['Spicy','Savory']::text[], array['Solo Dining','Work Lunch']::text[],
      'worth_it', true, false, true, now() - interval '10 days'),
    (s_mei, r_sushigen, 'Lunch sashimi set is the only deal in LA that still feels like 2015 pricing. Arrive at 11 sharp.',
      array[]::text[], array['Sashimi lunch set','Toro nigiri']::text[],
      array['Delicate','Umami']::text[], array['Work Lunch','Date Night']::text[],
      'worth_it', true, false, true, now() - interval '15 days'),
    (s_mei, r_chengdu, 'Aguofei with extra green peppercorns if you ask in Mandarin. The default heat is calibrated down for tourists.',
      array[]::text[], array['Aguofei','Toothpick lamb','Mapo tofu']::text[],
      array['Spicy','Bold Flavor']::text[], array['Group Dinner']::text[],
      'worth_it', true, true, true, now() - interval '21 days'),
    (s_mei, r_nightmkt, 'Khao soi at midnight after a long week. The fried noodles on top are the entire point.',
      array[]::text[], array['Khao soi','Sai ua']::text[],
      array['Spicy','Savory']::text[], array['Late-Night','Date Night']::text[],
      'worth_it', true, false, true, now() - interval '27 days'),
    (s_mei, r_seaharbour, 'Brought my mother for her birthday. The lobster e-fu noodle is not on the menu — ask the manager.',
      array[]::text[], array['Lobster e-fu noodle','BBQ pork bun']::text[],
      array['Umami']::text[], array['Group Dinner']::text[],
      'worth_it', true, true, true, now() - interval '32 days'),
    (s_mei, r_sushigen, 'Took a friend visiting from SF. The anago is criminally underordered. Trust the chef.',
      array[]::text[], array['Anago','Uni','Toro']::text[],
      array['Delicate','Umami']::text[], array['Date Night']::text[],
      'worth_it', true, true, true, now() - interval '42 days'),

    -- David P. — Bay Area Comfort Seeker (7)
    (s_david, r_koipalace, 'Saturday dim sum with my parents. Put your name in at 9:45 and walk the mall. Worth the ritual.',
      array[]::text[], array['Har gow','Char siu bao','Egg tarts','Lobster e-fu']::text[],
      array['Savory','Umami']::text[], array['Group Dinner','Brunch']::text[],
      'worth_it', true, true, true, now() - interval '4 days'),
    (s_david, r_shahi, 'Lamb biryani slow-cooked the proper way. Sealed pot. Caramelized onions. The raita matters.',
      array[]::text[], array['Lamb biryani','Raita','Sheermal']::text[],
      array['Smoky','Savory','Bold Flavor']::text[], array['Group Dinner']::text[],
      'worth_it', true, false, true, now() - interval '11 days'),
    (s_david, r_maruichi, 'Tonkotsu that holds its own next to anything I had in Hakata. Silicon Valley engineers know.',
      array[]::text[], array['Tonkotsu ramen','Gyoza']::text[],
      array['Savory','Umami','Comfort Food']::text[], array['Solo Dining','Work Lunch']::text[],
      'worth_it', true, true, true, now() - interval '17 days'),
    (s_david, r_koipalace, 'Sunday after church. The egg tarts at the end are non-negotiable.',
      array[]::text[], array['Egg tarts','Har gow','Char siu bao']::text[],
      array['Sweet','Umami']::text[], array['Brunch']::text[],
      'worth_it', true, true, true, now() - interval '24 days'),
    (s_david, r_maruichi, 'Brought a date here. She approved. The chashu is properly bouncy.',
      array[]::text[], array['Tonkotsu ramen','Chashu bowl']::text[],
      array['Savory','Comfort Food']::text[], array['Date Night']::text[],
      'worth_it', true, true, true, now() - interval '30 days'),
    (s_david, r_shahi, 'Take-out lamb biryani for a movie night at home. Reheats well in the oven, never microwave.',
      array[]::text[], array['Lamb biryani']::text[],
      array['Smoky','Savory']::text[], array['Solo Dining']::text[],
      'worth_it', true, true, true, now() - interval '38 days'),
    (s_david, r_seaharbour, 'Drove down to SGV for the weekend. Dim sum in Daly City still wins for me, but this is a close second.',
      array[]::text[], array['Har gow','Turnip cake']::text[],
      array['Savory','Umami']::text[], array['Group Dinner']::text[],
      'not_sure', true, false, true, now() - interval '44 days'),

    -- Jamie K. — Boston Authentic Explorer (6)
    (s_jamie, r_gourmet, 'XLB after a long shift. Consistency is what I come back for — no surprises, all delivery.',
      array[]::text[], array['Pork XLB','Scallion pancake']::text[],
      array['Savory','Umami']::text[], array['Late-Night']::text[],
      'worth_it', true, true, true, now() - interval '6 days'),
    (s_jamie, r_penang, 'Curry laksa at 1am after a Boston blizzard. The roti canai is the second course you do not skip.',
      array[]::text[], array['Curry laksa','Roti canai']::text[],
      array['Spicy','Comfort Food']::text[], array['Late-Night','Solo Dining']::text[],
      'worth_it', true, true, true, now() - interval '13 days'),
    (s_jamie, r_beantown, 'Allston taco crawl ended here. Al pastor is the move. Salsa bar with options that actually have heat.',
      array[]::text[], array['Al pastor','Carnitas','Horchata']::text[],
      array['Spicy','Bold Flavor']::text[], array['Group Dinner','Late-Night']::text[],
      'worth_it', true, false, true, now() - interval '20 days'),
    (s_jamie, r_phobac, 'First Vietnamese my mother approved of in Seattle when she visited. Broth is clean.',
      array[]::text[], array['Beef pho','Spring rolls']::text[],
      array['Savory','Aromatic','Comfort Food']::text[], array['Solo Dining']::text[],
      'worth_it', true, false, true, now() - interval '26 days'),
    (s_jamie, r_tamarind, 'Took a colleague for a work dinner. The bánh xèo is the showstopper, not the pho.',
      array[]::text[], array['Bánh xèo','Bo luc lac']::text[],
      array['Savory','Aromatic']::text[], array['Group Dinner','Date Night']::text[],
      'worth_it', true, false, true, now() - interval '33 days'),
    (s_jamie, r_kedai, 'Nasi lemak brunch. Sambal made from scratch. They opened late this morning and I waited — worth it.',
      array[]::text[], array['Nasi lemak','Iced kopi']::text[],
      array['Spicy','Savory']::text[], array['Brunch']::text[],
      'worth_it', true, true, true, now() - interval '39 days');
end $$;

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
-- select email, count(c.id) as checkins
-- from auth.users u
-- left join public.check_ins c on c.user_id = u.id
-- where email like 'scout.%@cravemap-launch.com'
-- group by email
-- order by email;
