-- ============================================================================
-- CraveMap / 好吃GO — Beta Test Content (Saved + Check-ins)
-- ============================================================================
-- Apply AFTER 01-beta-users.sql.
-- All INSERTs are idempotent (ON CONFLICT DO NOTHING).
--
-- Triggers fire automatically:
--   - bump_checkin_count   (check_in_count++ on profile)
--   - bump_saved_count     (saved_count++ on profile)
--   - founding_scout_progress VIEW recomputes on every query
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Resolve tester UUIDs (we look them up by email to avoid hard-coding)
-- ---------------------------------------------------------------------------
do $$
declare
  t1 uuid := (select id from auth.users where email = 'tester1+beta@cravemap.app');
  t2 uuid := (select id from auth.users where email = 'tester2+beta@cravemap.app');
  t3 uuid := (select id from auth.users where email = 'tester3+beta@cravemap.app');

  -- Restaurant UUIDs from seed.sql (slug-stable seed UUIDs 0001..0032)
  r_xian          uuid := '00000000-0000-4000-8000-000000000001'; -- Xi'an Famous Foods (NYC)
  r_nanxiang      uuid := '00000000-0000-4000-8000-000000000002'; -- Nan Xiang XLB (NYC)
  r_whitebear     uuid := '00000000-0000-4000-8000-000000000003'; -- White Bear (NYC)
  r_uglybaby      uuid := '00000000-0000-4000-8000-000000000009'; -- Ugly Baby (NYC, Thai)
  r_seaharbour    uuid := '00000000-0000-4000-8000-000000000011'; -- Sea Harbour (LA)
  r_birria        uuid := '00000000-0000-4000-8000-000000000010'; -- Birria-Landia (NYC)
  r_spicyvillage  uuid := '00000000-0000-4000-8000-000000000005'; -- Spicy Village (NYC)
  r_phobang       uuid := '00000000-0000-4000-8000-000000000006'; -- Pho Bang (NYC)
begin
  if t1 is null or t2 is null or t3 is null then
    raise notice 'One or more tester users missing. Run 01-beta-users.sql first.';
    return;
  end if;

  -- -------------------------------------------------------------------------
  -- Saved restaurants (counts shown in profile.saved_count via trigger)
  -- -------------------------------------------------------------------------
  insert into public.saved_restaurants (user_id, restaurant_id) values
    (t1, r_xian), (t1, r_nanxiang), (t1, r_whitebear),
    (t1, r_uglybaby), (t1, r_birria), (t1, r_spicyvillage)
  on conflict (user_id, restaurant_id) do nothing;

  insert into public.saved_restaurants (user_id, restaurant_id) values
    (t2, r_seaharbour), (t2, r_nanxiang), (t2, r_uglybaby)
  on conflict (user_id, restaurant_id) do nothing;

  insert into public.saved_restaurants (user_id, restaurant_id) values
    (t3, r_xian), (t3, r_phobang)
  on conflict (user_id, restaurant_id) do nothing;

  -- -------------------------------------------------------------------------
  -- Check-ins for Tester1 (Alex Chen): 3 check-ins, one today (NEW pill)
  -- -------------------------------------------------------------------------
  insert into public.check_ins (
    user_id, restaurant_id, review, photos, ordered_items,
    taste_tags, scene_tags, hype_rating, location_verified,
    is_repeat_visit, would_return, created_at
  ) values
    (t1, r_whitebear,
     'This place wrecked me in the best way. The biangbiang noodles are wider than my hand and the chili oil is dangerous. First visit but definitely not the last.',
     array['https://picsum.photos/seed/t1ck1a/400/300','https://picsum.photos/seed/t1ck1b/400/300']::text[],
     array['Biangbiang noodles', 'Cumin lamb skewers', 'Tiger vegetables']::text[],
     array['Spicy','Savory','Umami','Bold Flavor']::text[],
     array['Solo Dining','Late-Night']::text[],
     'worth_it'::hype_rating, true, false, true,
     now()),
    (t1, r_nanxiang,
     'Brought my mom here. She grew up in Shanghai. She cried. The crab roe XLB were everything she had been chasing.',
     array['https://picsum.photos/seed/t1ck2/400/300']::text[],
     array['Crab roe XLB','Pork XLB','Pan-fried buns']::text[],
     array['Savory','Umami','Delicate']::text[],
     array['Family Dinner']::text[],
     'worth_it'::hype_rating, true, false, true,
     now() - interval '18 days'),
    (t1, r_uglybaby,
     'Thai-spicy means something real here. The som tum pla ra had my table sweating. Order the sai ua. You will understand.',
     array[]::text[],
     array['Som tum pla ra','Sai ua sausage','Khao kluk kapi']::text[],
     array['Very Spicy','Sour','Fermented']::text[],
     array['With Friends','Adventure']::text[],
     'worth_it'::hype_rating, false, false, true,
     now() - interval '36 days');

  -- -------------------------------------------------------------------------
  -- Check-ins for Tester2 (Mei Lin): 1 check-in
  -- -------------------------------------------------------------------------
  insert into public.check_ins (
    user_id, restaurant_id, review, photos, ordered_items,
    taste_tags, scene_tags, hype_rating, location_verified,
    is_repeat_visit, would_return, created_at
  ) values
    (t2, r_seaharbour,
     'Dim sum on a Sunday with my parents. The har gow skin is translucent, the turnip cake is golden on both sides. They have not changed and I am grateful.',
     array['https://picsum.photos/seed/t2ck1/400/300']::text[],
     array['Har gow','Turnip cake','BBQ pork bun','Egg tarts']::text[],
     array['Savory','Umami','Delicate']::text[],
     array['Family Dinner','Weekend Brunch']::text[],
     'worth_it'::hype_rating, true, true, true,
     now() - interval '5 days');

  -- -------------------------------------------------------------------------
  -- Check-ins for Tester3 (David Park): 2 check-ins (testing helpful counter)
  -- -------------------------------------------------------------------------
  insert into public.check_ins (
    user_id, restaurant_id, review, photos, ordered_items,
    taste_tags, scene_tags, hype_rating, location_verified,
    is_repeat_visit, would_return, created_at
  ) values
    (t3, r_xian,
     'Bay Area transplant test: does NYC Xian actually clear the SGV bar? Yes. The cumin lamb noodles are heavier on the spice and lighter on the grease.',
     array['https://picsum.photos/seed/t3ck1/400/300']::text[],
     array['Cumin lamb noodles','Spicy & tingly beef']::text[],
     array['Spicy','Savory','Bold Flavor']::text[],
     array['Quick Lunch']::text[],
     'worth_it'::hype_rating, true, false, true,
     now() - interval '12 days'),
    (t3, r_phobang,
     'Rainy Sunday in Chinatown. Broth was clean and rich, not the over-salted version most spots ship now. Cheap and exactly what I wanted.',
     array[]::text[],
     array['Beef pho','Vietnamese iced coffee']::text[],
     array['Savory','Aromatic','Comfort']::text[],
     array['Solo Dining','Cheap Eats']::text[],
     'worth_it'::hype_rating, true, false, true,
     now() - interval '21 days');
end $$;

-- ---------------------------------------------------------------------------
-- Verification queries
-- ---------------------------------------------------------------------------
-- select email, p.name, p.check_in_count, p.saved_count, p.invite_count
-- from auth.users u join public.profiles p on p.id = u.id
-- where email like 'tester%+beta@cravemap.app'
-- order by email;
--
-- select * from public.founding_scout_progress
-- where user_id in (
--   select id from auth.users where email like 'tester%+beta@cravemap.app'
-- );
