-- ============================================================================
-- CraveMap / 好吃GO — Initial Schema
-- ============================================================================
-- Apply this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type price_tier as enum ('$', '$$', '$$$', '$$$$');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hype_rating as enum ('worth_it', 'overhyped', 'not_sure');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trending_signal as enum ('trending', 'rising', 'underrated', 'classic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type beta_city as enum ('New York City', 'Los Angeles', 'Bay Area', 'Seattle', 'Boston');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles (1:1 with auth.users, created via trigger)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  bio text,
  city beta_city,

  trust_sources text[] default '{}',
  taste_preferences text[] default '{}',
  dislikes text[] default '{}',
  diet_needs text[] default '{}',
  food_scenes text[] default '{}',
  taste_passport_complete boolean default false,
  persona text,

  check_in_count int default 0,
  saved_count int default 0,
  invite_count int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_city on public.profiles(city);

-- restaurants (CMS content)
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city beta_city not null,
  neighborhood text not null,
  cuisine text not null,
  price price_tier not null,

  description text,
  recommendation_reason text,

  address text not null,
  hours text,
  phone text,
  website text,
  images text[] default '{}',
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,

  tags text[] default '{}',
  categories text[] default '{}',
  best_for text[] default '{}',
  avoid_if text[] default '{}',

  is_open boolean default true,
  wait_time text,

  insider_tip text,
  what_locals_order text[] default '{}',
  best_time_to_go text,
  trending_signal trending_signal,

  verified_check_ins int default 0,
  local_approved_percent int default 0,
  recent_visits int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_restaurants_city on public.restaurants(city);
create index if not exists idx_restaurants_categories on public.restaurants using gin(categories);
create index if not exists idx_restaurants_trending on public.restaurants(trending_signal) where trending_signal is not null;

-- check_ins
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,

  review text not null,
  photos text[] default '{}',
  ordered_items text[] default '{}',

  taste_tags text[] default '{}',
  diet_tags text[] default '{}',
  scene_tags text[] default '{}',

  is_repeat_visit boolean default false,
  would_return boolean,
  hype_rating hype_rating not null,
  location_verified boolean default false,

  helpful_count int default 0,

  created_at timestamptz default now()
);

create index if not exists idx_checkins_restaurant on public.check_ins(restaurant_id);
create index if not exists idx_checkins_user on public.check_ins(user_id);
create index if not exists idx_checkins_recent on public.check_ins(restaurant_id, created_at desc);

-- saved_restaurants
create table if not exists public.saved_restaurants (
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  saved_at timestamptz default now(),
  primary key (user_id, restaurant_id)
);

create index if not exists idx_saved_user on public.saved_restaurants(user_id, saved_at desc);
create index if not exists idx_saved_restaurant on public.saved_restaurants(restaurant_id);

-- check_in_helpful
create table if not exists public.check_in_helpful (
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_id uuid not null references public.check_ins(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, check_in_id)
);

-- invites
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text,
  invitee_id uuid references public.profiles(id) on delete set null,
  code text unique not null,
  accepted_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_invites_code on public.invites(code);
create index if not exists idx_invites_inviter on public.invites(inviter_id);

-- ---------------------------------------------------------------------------
-- View: founding_scout_progress
-- ---------------------------------------------------------------------------
create or replace view public.founding_scout_progress as
select
  p.id as user_id,
  p.taste_passport_complete as taste_passport,
  (p.check_in_count >= 3) as three_check_ins,
  exists(
    select 1 from public.check_ins c
    where c.user_id = p.id and c.location_verified = true
  ) as verified_check_in,
  (p.invite_count >= 2) as two_invites
from public.profiles p;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_restaurants_updated_at on public.restaurants;
create trigger trg_restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New Foodie'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- counter triggers
create or replace function public.bump_checkin_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set check_in_count = check_in_count + 1 where id = new.user_id;
    update public.restaurants set verified_check_ins = verified_check_ins + 1 where id = new.restaurant_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set check_in_count = greatest(check_in_count - 1, 0) where id = old.user_id;
    update public.restaurants set verified_check_ins = greatest(verified_check_ins - 1, 0) where id = old.restaurant_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_checkin_counters on public.check_ins;
create trigger trg_checkin_counters
  after insert or delete on public.check_ins
  for each row execute function public.bump_checkin_count();

create or replace function public.bump_saved_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set saved_count = saved_count + 1 where id = new.user_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set saved_count = greatest(saved_count - 1, 0) where id = old.user_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_saved_counters on public.saved_restaurants;
create trigger trg_saved_counters
  after insert or delete on public.saved_restaurants
  for each row execute function public.bump_saved_count();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.restaurants         enable row level security;
alter table public.check_ins           enable row level security;
alter table public.saved_restaurants   enable row level security;
alter table public.check_in_helpful    enable row level security;
alter table public.invites             enable row level security;

-- profiles
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles for select using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- restaurants
drop policy if exists restaurants_select_all on public.restaurants;
create policy restaurants_select_all on public.restaurants for select using (true);

-- check_ins
drop policy if exists checkins_select_all on public.check_ins;
create policy checkins_select_all on public.check_ins for select using (true);

drop policy if exists checkins_insert_own on public.check_ins;
create policy checkins_insert_own on public.check_ins for insert with check (auth.uid() = user_id);

drop policy if exists checkins_update_own on public.check_ins;
create policy checkins_update_own on public.check_ins for update using (auth.uid() = user_id);

drop policy if exists checkins_delete_own on public.check_ins;
create policy checkins_delete_own on public.check_ins for delete using (auth.uid() = user_id);

-- saved_restaurants
drop policy if exists saved_select_own on public.saved_restaurants;
create policy saved_select_own on public.saved_restaurants for select using (auth.uid() = user_id);

drop policy if exists saved_insert_own on public.saved_restaurants;
create policy saved_insert_own on public.saved_restaurants for insert with check (auth.uid() = user_id);

drop policy if exists saved_delete_own on public.saved_restaurants;
create policy saved_delete_own on public.saved_restaurants for delete using (auth.uid() = user_id);

-- check_in_helpful
drop policy if exists helpful_select_all on public.check_in_helpful;
create policy helpful_select_all on public.check_in_helpful for select using (true);

drop policy if exists helpful_insert_own on public.check_in_helpful;
create policy helpful_insert_own on public.check_in_helpful for insert with check (auth.uid() = user_id);

drop policy if exists helpful_delete_own on public.check_in_helpful;
create policy helpful_delete_own on public.check_in_helpful for delete using (auth.uid() = user_id);

-- invites
drop policy if exists invites_select_own on public.invites;
create policy invites_select_own on public.invites for select using (auth.uid() = inviter_id);

drop policy if exists invites_insert_own on public.invites;
create policy invites_insert_own on public.invites for insert with check (auth.uid() = inviter_id);
