-- ============================================================================
-- CraveMap — Migration 001: Base Schema
-- ============================================================================
-- Run this in Supabase SQL Editor BEFORE migration 002.
--
-- Creates:
--   • profiles              — user profiles, synced from auth.users on signup
--   • restaurants           — restaurant listings
--   • check_ins             — user check-ins
--   • check_in_helpful      — helpful marks (deduplicated per user)
--   • saved_restaurants     — bookmarked restaurants per user
--   • invites               — invite codes
--   • founding_scout_progress — per-user reward milestone tracking
--
-- Plus triggers to keep counters in sync, and RPCs for atomic operations:
--   • increment_check_in_helpful(p_check_in_id)
--   • redeem_invite(p_code)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Storage buckets (run separately if SQL Editor can't create buckets)
-- ---------------------------------------------------------------------------
-- These are created via Supabase Dashboard → Storage if the INSERT fails.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('check-in-photos', 'check-in-photos', true),
  ('avatars',         'avatars',         true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
DO $$
BEGIN
  -- check-in-photos: upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'checkin_photos_insert'
  ) THEN
    CREATE POLICY checkin_photos_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'check-in-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
    CREATE POLICY checkin_photos_select ON storage.objects
      FOR SELECT TO public USING (bucket_id = 'check-in-photos');
    CREATE POLICY avatars_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    CREATE POLICY avatars_upsert ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    CREATE POLICY avatars_select ON storage.objects
      FOR SELECT TO public USING (bucket_id = 'avatars');
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    text,
  avatar_url              text,
  bio                     text,
  city                    text,
  trust_sources           text[]      NOT NULL DEFAULT '{}',
  taste_preferences       text[]      NOT NULL DEFAULT '{}',
  dislikes                text[]      NOT NULL DEFAULT '{}',
  diet_needs              text[]      NOT NULL DEFAULT '{}',
  food_scenes             text[]      NOT NULL DEFAULT '{}',
  taste_passport_complete boolean     NOT NULL DEFAULT false,
  persona                 text,
  check_in_count          integer     NOT NULL DEFAULT 0,
  saved_count             integer     NOT NULL DEFAULT 0,
  invite_count            integer     NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- restaurants ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurants (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text        UNIQUE,
  name                  text        NOT NULL,
  city                  text        NOT NULL,
  neighborhood          text        NOT NULL,
  cuisine               text        NOT NULL,
  price                 text        NOT NULL CHECK (price IN ('$', '$$', '$$$', '$$$$')),
  description           text,
  recommendation_reason text,
  address               text        NOT NULL,
  hours                 text,
  phone                 text,
  website               text,
  images                text[]      NOT NULL DEFAULT '{}',
  latitude              numeric(10, 7) NOT NULL,
  longitude             numeric(10, 7) NOT NULL,
  tags                  text[]      NOT NULL DEFAULT '{}',
  categories            text[]      NOT NULL DEFAULT '{}',
  best_for              text[]      NOT NULL DEFAULT '{}',
  avoid_if              text[]      NOT NULL DEFAULT '{}',
  is_open               boolean              DEFAULT true,
  wait_time             text,
  insider_tip           text,
  what_locals_order     text[]      NOT NULL DEFAULT '{}',
  best_time_to_go       text,
  trending_signal       text        CHECK (trending_signal IN ('trending', 'rising', 'underrated', 'classic')),
  verified_check_ins    integer     NOT NULL DEFAULT 0,
  local_approved_percent integer    NOT NULL DEFAULT 0 CHECK (local_approved_percent BETWEEN 0 AND 100),
  recent_visits         integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- check_ins ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.check_ins (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id    uuid        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  review           text        NOT NULL DEFAULT '',
  photos           text[]      NOT NULL DEFAULT '{}',
  ordered_items    text[]      NOT NULL DEFAULT '{}',
  taste_tags       text[]      NOT NULL DEFAULT '{}',
  diet_tags        text[]      NOT NULL DEFAULT '{}',
  scene_tags       text[]      NOT NULL DEFAULT '{}',
  is_repeat_visit  boolean     NOT NULL DEFAULT false,
  would_return     boolean,
  hype_rating      text        NOT NULL CHECK (hype_rating IN ('worth_it', 'overhyped', 'not_sure')),
  location_verified boolean    NOT NULL DEFAULT false,
  helpful_count    integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- check_in_helpful -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.check_in_helpful (
  check_in_id uuid        NOT NULL REFERENCES public.check_ins(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (check_in_id, user_id)
);

-- saved_restaurants ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_restaurants (
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  saved_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, restaurant_id)
);

-- invites --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invites (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code                text        NOT NULL UNIQUE,
  invitee_email       text,
  accepted_at         timestamptz,
  accepted_by_user_id uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- founding_scout_progress ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.founding_scout_progress (
  user_id       uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  taste_passport  boolean   NOT NULL DEFAULT false,
  three_check_ins boolean   NOT NULL DEFAULT false,
  verified_check_in boolean NOT NULL DEFAULT false,
  two_invites     boolean   NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_restaurants_city         ON public.restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_trending      ON public.restaurants(trending_signal);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id         ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_restaurant_id   ON public.check_ins(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at      ON public.check_ins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_user_id             ON public.saved_restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_inviter_id        ON public.invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_code              ON public.invites(code);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_helpful      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_restaurants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_scout_progress ENABLE ROW LEVEL SECURITY;

-- profiles: readable by all authenticated, editable only by owner
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_select_anon" ON public.profiles FOR SELECT TO anon           USING (true);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- restaurants: public read, no client writes (seeded by admin)
CREATE POLICY "restaurants_select_all"  ON public.restaurants FOR SELECT TO authenticated USING (true);
CREATE POLICY "restaurants_select_anon" ON public.restaurants FOR SELECT TO anon           USING (true);

-- check_ins: public read, authenticated insert/delete own
CREATE POLICY "checkins_select_all"  ON public.check_ins FOR SELECT TO authenticated USING (true);
CREATE POLICY "checkins_select_anon" ON public.check_ins FOR SELECT TO anon           USING (true);
CREATE POLICY "checkins_insert_own"  ON public.check_ins FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "checkins_update_own"  ON public.check_ins FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "checkins_delete_own"  ON public.check_ins FOR DELETE TO authenticated USING (user_id = auth.uid());

-- check_in_helpful: each user manages their own helpful marks
CREATE POLICY "helpful_select_own" ON public.check_in_helpful FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "helpful_insert_own" ON public.check_in_helpful FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "helpful_delete_own" ON public.check_in_helpful FOR DELETE TO authenticated USING (user_id = auth.uid());

-- saved_restaurants: private per user
CREATE POLICY "saved_select_own" ON public.saved_restaurants FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "saved_insert_own" ON public.saved_restaurants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_delete_own" ON public.saved_restaurants FOR DELETE TO authenticated USING (user_id = auth.uid());

-- invites: users can read their own invites + any by code to redeem
CREATE POLICY "invites_select_own"  ON public.invites FOR SELECT TO authenticated USING (inviter_id = auth.uid() OR accepted_by_user_id = auth.uid());
CREATE POLICY "invites_insert_own"  ON public.invites FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid());

-- founding_scout_progress: read own
CREATE POLICY "scout_select_own" ON public.founding_scout_progress FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Trigger: auto-create profile + scout row on new auth user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_name text;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1),
    'New Foodie'
  );

  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, v_name)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.founding_scout_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: sync taste_passport flag to founding_scout_progress
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_taste_passport_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.taste_passport_complete IS DISTINCT FROM OLD.taste_passport_complete THEN
    INSERT INTO public.founding_scout_progress (user_id, taste_passport, updated_at)
    VALUES (NEW.id, NEW.taste_passport_complete, now())
    ON CONFLICT (user_id) DO UPDATE
      SET taste_passport = NEW.taste_passport_complete,
          updated_at     = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_taste_passport_updated ON public.profiles;
CREATE TRIGGER on_profile_taste_passport_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_taste_passport_flag();

-- ---------------------------------------------------------------------------
-- Trigger: maintain check_in_count + founding_scout milestones
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_check_in_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid;
  v_count    integer;
  v_verified integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_uid := NEW.user_id;
    UPDATE public.profiles SET check_in_count = check_in_count + 1, updated_at = now() WHERE id = v_uid;
  ELSE
    v_uid := OLD.user_id;
    UPDATE public.profiles SET check_in_count = GREATEST(check_in_count - 1, 0), updated_at = now() WHERE id = v_uid;
  END IF;

  -- Re-derive milestone flags from live counts
  SELECT COUNT(*) INTO v_count   FROM public.check_ins WHERE user_id = v_uid;
  SELECT COUNT(*) INTO v_verified FROM public.check_ins WHERE user_id = v_uid AND location_verified = true;

  INSERT INTO public.founding_scout_progress (user_id, three_check_ins, verified_check_in, updated_at)
  VALUES (v_uid, v_count >= 3, v_verified >= 1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET three_check_ins   = v_count >= 3,
        verified_check_in = v_verified >= 1,
        updated_at        = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_check_in_inserted ON public.check_ins;
DROP TRIGGER IF EXISTS on_check_in_deleted  ON public.check_ins;
CREATE TRIGGER on_check_in_inserted
  AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.on_check_in_change();
CREATE TRIGGER on_check_in_deleted
  AFTER DELETE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.on_check_in_change();

-- ---------------------------------------------------------------------------
-- Trigger: maintain saved_count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_saved_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET saved_count = saved_count + 1, updated_at = now() WHERE id = NEW.user_id;
  ELSE
    UPDATE public.profiles SET saved_count = GREATEST(saved_count - 1, 0), updated_at = now() WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_saved_restaurant_inserted ON public.saved_restaurants;
DROP TRIGGER IF EXISTS on_saved_restaurant_deleted  ON public.saved_restaurants;
CREATE TRIGGER on_saved_restaurant_inserted
  AFTER INSERT ON public.saved_restaurants
  FOR EACH ROW EXECUTE FUNCTION public.on_saved_change();
CREATE TRIGGER on_saved_restaurant_deleted
  AFTER DELETE ON public.saved_restaurants
  FOR EACH ROW EXECUTE FUNCTION public.on_saved_change();

-- ---------------------------------------------------------------------------
-- Trigger: bump_invite_count_on_accept + two_invites milestone
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_accepted_count integer;
BEGIN
  -- Only fire when accepted_at transitions from NULL → non-NULL
  IF OLD.accepted_at IS NOT NULL OR NEW.accepted_at IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles SET invite_count = invite_count + 1, updated_at = now() WHERE id = NEW.inviter_id;

  SELECT COUNT(*) INTO v_accepted_count
  FROM public.invites
  WHERE inviter_id = NEW.inviter_id AND accepted_at IS NOT NULL;

  INSERT INTO public.founding_scout_progress (user_id, two_invites, updated_at)
  VALUES (NEW.inviter_id, v_accepted_count >= 2, now())
  ON CONFLICT (user_id) DO UPDATE
    SET two_invites = v_accepted_count >= 2,
        updated_at  = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bump_invite_count_on_accept ON public.invites;
CREATE TRIGGER bump_invite_count_on_accept
  AFTER UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.on_invite_accepted();

-- ---------------------------------------------------------------------------
-- RPC: increment_check_in_helpful  (atomic, deduped per user)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_check_in_helpful(p_check_in_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id      uuid    := auth.uid();
  v_rows_inserted integer;
  v_new_count    integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  INSERT INTO public.check_in_helpful (check_in_id, user_id)
  VALUES (p_check_in_id, v_user_id)
  ON CONFLICT (check_in_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;

  IF v_rows_inserted = 0 THEN
    SELECT helpful_count INTO v_new_count FROM public.check_ins WHERE id = p_check_in_id;
    RETURN jsonb_build_object('success', true, 'helpful_count', v_new_count, 'already_marked', true);
  END IF;

  UPDATE public.check_ins
  SET helpful_count = helpful_count + 1
  WHERE id = p_check_in_id
  RETURNING helpful_count INTO v_new_count;

  RETURN jsonb_build_object('success', true, 'helpful_count', v_new_count, 'already_marked', false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_check_in_helpful(uuid) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.increment_check_in_helpful(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: redeem_invite  (validates, prevents self/double redeem, fires trigger)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_invite  public.invites%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_invite
  FROM public.invites
  WHERE code = UPPER(TRIM(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code. Codes look like CRAVE-XXXXXX.');
  END IF;

  IF v_invite.inviter_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot redeem your own invite code.');
  END IF;

  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invite code has already been used.');
  END IF;

  UPDATE public.invites
  SET accepted_at         = now(),
      accepted_by_user_id = v_user_id
  WHERE id = v_invite.id;
  -- bump_invite_count_on_accept trigger fires here automatically

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_invite(text) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.redeem_invite(text) TO authenticated;
