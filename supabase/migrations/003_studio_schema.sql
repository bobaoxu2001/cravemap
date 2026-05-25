-- ============================================================================
-- CraveMap — Migration 003: CraveMap Studio (merchant side)
-- ============================================================================
-- Adds the merchant-facing schema that powers CraveMap Studio:
--   • merchant_profiles        — 1:1 with auth.users for restaurant owners
--   • restaurant_menu_sources  — raw menu inputs (pasted text, URLs, uploads)
--   • ai_menu_analyses         — AI-generated insights derived from a source
--   • ai_campaigns             — AI-generated marketing campaigns
--   • ai_agent_logs            — execution telemetry for every agent run
--   • merchant_payments        — billing records (Stripe/etc.)
--   • user_interest_events     — diner-side signals about merchant intent
--
-- Safe to re-run: uses CREATE … IF NOT EXISTS and DROP POLICY IF EXISTS.
-- Does NOT modify any tables from migrations 001 or 002.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: generic updated_at trigger (idempotent)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type menu_source_type as enum ('text', 'url', 'upload');
exception when duplicate_object then null; end $$;

do $$ begin
  create type menu_source_status as enum ('pending', 'processed', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type agent_run_status as enum ('success', 'failed', 'partial', 'timeout');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded', 'canceled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. merchant_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.merchant_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  restaurant_name  text not null,
  owner_name       text,
  owner_email      text,
  phone            text,
  city             text,
  cuisine_type     text,
  website_url      text,
  google_maps_url  text,
  instagram_url    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_merchant_profiles_user      on public.merchant_profiles(user_id);
create index if not exists idx_merchant_profiles_city      on public.merchant_profiles(city);
create index if not exists idx_merchant_profiles_created   on public.merchant_profiles(created_at desc);

drop trigger if exists trg_merchant_profiles_updated on public.merchant_profiles;
create trigger trg_merchant_profiles_updated
  before update on public.merchant_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. restaurant_menu_sources
-- ---------------------------------------------------------------------------
create table if not exists public.restaurant_menu_sources (
  id             uuid primary key default gen_random_uuid(),
  merchant_id    uuid not null references public.merchant_profiles(id) on delete cascade,
  source_type    menu_source_type not null,
  raw_menu_text  text,
  source_url     text,
  status         menu_source_status not null default 'pending',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_menu_sources_merchant on public.restaurant_menu_sources(merchant_id);
create index if not exists idx_menu_sources_status   on public.restaurant_menu_sources(status);
create index if not exists idx_menu_sources_created  on public.restaurant_menu_sources(created_at desc);

drop trigger if exists trg_menu_sources_updated on public.restaurant_menu_sources;
create trigger trg_menu_sources_updated
  before update on public.restaurant_menu_sources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. ai_menu_analyses
-- ---------------------------------------------------------------------------
create table if not exists public.ai_menu_analyses (
  id                  uuid primary key default gen_random_uuid(),
  merchant_id         uuid not null references public.merchant_profiles(id) on delete cascade,
  menu_source_id      uuid references public.restaurant_menu_sources(id) on delete set null,
  summary             text,
  top_dishes          jsonb default '[]'::jsonb,
  customer_personas   jsonb default '[]'::jsonb,
  taste_tags          jsonb default '[]'::jsonb,
  pricing_insights    jsonb default '{}'::jsonb,
  health_positioning  jsonb default '{}'::jsonb,
  raw_ai_output       jsonb default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists idx_menu_analyses_merchant on public.ai_menu_analyses(merchant_id);
create index if not exists idx_menu_analyses_source   on public.ai_menu_analyses(menu_source_id);
create index if not exists idx_menu_analyses_created  on public.ai_menu_analyses(created_at desc);

-- ---------------------------------------------------------------------------
-- 4. ai_campaigns
-- ---------------------------------------------------------------------------
create table if not exists public.ai_campaigns (
  id                    uuid primary key default gen_random_uuid(),
  merchant_id           uuid not null references public.merchant_profiles(id) on delete cascade,
  menu_analysis_id      uuid references public.ai_menu_analyses(id) on delete set null,
  campaign_title        text not null,
  campaign_goal         text,
  content_calendar      jsonb default '[]'::jsonb,
  short_video_scripts   jsonb default '[]'::jsonb,
  instagram_captions    jsonb default '[]'::jsonb,
  recommendation_cards  jsonb default '[]'::jsonb,
  raw_ai_output         jsonb default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists idx_campaigns_merchant on public.ai_campaigns(merchant_id);
create index if not exists idx_campaigns_analysis on public.ai_campaigns(menu_analysis_id);
create index if not exists idx_campaigns_created  on public.ai_campaigns(created_at desc);

-- ---------------------------------------------------------------------------
-- 5. ai_agent_logs
-- ---------------------------------------------------------------------------
create table if not exists public.ai_agent_logs (
  id                uuid primary key default gen_random_uuid(),
  merchant_id       uuid references public.merchant_profiles(id) on delete cascade,
  agent_name        text not null,
  action_type       text not null,
  input_snapshot    jsonb default '{}'::jsonb,
  output_snapshot   jsonb default '{}'::jsonb,
  model_used        text,
  provider          text,
  status            agent_run_status not null default 'success',
  error_message     text,
  latency_ms        integer,
  created_at        timestamptz not null default now()
);

create index if not exists idx_agent_logs_merchant on public.ai_agent_logs(merchant_id);
create index if not exists idx_agent_logs_agent    on public.ai_agent_logs(agent_name);
create index if not exists idx_agent_logs_status   on public.ai_agent_logs(status);
create index if not exists idx_agent_logs_created  on public.ai_agent_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- 6. merchant_payments
-- ---------------------------------------------------------------------------
create table if not exists public.merchant_payments (
  id                    uuid primary key default gen_random_uuid(),
  merchant_id           uuid not null references public.merchant_profiles(id) on delete cascade,
  amount_cents          integer not null check (amount_cents >= 0),
  currency              text not null default 'USD',
  payment_provider      text not null,
  payment_status        payment_status not null default 'pending',
  external_payment_id   text,
  product_name          text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_payments_merchant on public.merchant_payments(merchant_id);
create index if not exists idx_payments_status   on public.merchant_payments(payment_status);
create index if not exists idx_payments_created  on public.merchant_payments(created_at desc);
create unique index if not exists uq_payments_provider_external
  on public.merchant_payments(payment_provider, external_payment_id)
  where external_payment_id is not null;

-- ---------------------------------------------------------------------------
-- 7. user_interest_events
-- ---------------------------------------------------------------------------
create table if not exists public.user_interest_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  restaurant_id   uuid references public.restaurants(id) on delete set null,
  merchant_id     uuid references public.merchant_profiles(id) on delete set null,
  event_type      text not null,
  taste_tags      jsonb default '[]'::jsonb,
  query_text      text,
  source_screen   text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_interest_user       on public.user_interest_events(user_id);
create index if not exists idx_interest_restaurant on public.user_interest_events(restaurant_id);
create index if not exists idx_interest_merchant   on public.user_interest_events(merchant_id);
create index if not exists idx_interest_event_type on public.user_interest_events(event_type);
create index if not exists idx_interest_created    on public.user_interest_events(created_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.merchant_profiles        enable row level security;
alter table public.restaurant_menu_sources  enable row level security;
alter table public.ai_menu_analyses         enable row level security;
alter table public.ai_campaigns             enable row level security;
alter table public.ai_agent_logs            enable row level security;
alter table public.merchant_payments        enable row level security;
alter table public.user_interest_events     enable row level security;

-- ---------------------------------------------------------------------------
-- merchant_profiles: owner full CRUD on their own row
-- ---------------------------------------------------------------------------
drop policy if exists merchant_profiles_select_own on public.merchant_profiles;
create policy merchant_profiles_select_own on public.merchant_profiles
  for select using (auth.uid() = user_id);

drop policy if exists merchant_profiles_insert_own on public.merchant_profiles;
create policy merchant_profiles_insert_own on public.merchant_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists merchant_profiles_update_own on public.merchant_profiles;
create policy merchant_profiles_update_own on public.merchant_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists merchant_profiles_delete_own on public.merchant_profiles;
create policy merchant_profiles_delete_own on public.merchant_profiles
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Owner-scoped policy helper (inline EXISTS via merchant_profiles ownership)
-- ---------------------------------------------------------------------------
-- restaurant_menu_sources
drop policy if exists menu_sources_owner_all on public.restaurant_menu_sources;
create policy menu_sources_owner_all on public.restaurant_menu_sources
  for all
  using (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = restaurant_menu_sources.merchant_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = restaurant_menu_sources.merchant_id and m.user_id = auth.uid()
    )
  );

-- ai_menu_analyses — owner can read; writes typically by service role
drop policy if exists menu_analyses_owner_select on public.ai_menu_analyses;
create policy menu_analyses_owner_select on public.ai_menu_analyses
  for select using (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = ai_menu_analyses.merchant_id and m.user_id = auth.uid()
    )
  );

-- ai_campaigns — owner read/write
drop policy if exists campaigns_owner_select on public.ai_campaigns;
create policy campaigns_owner_select on public.ai_campaigns
  for select using (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = ai_campaigns.merchant_id and m.user_id = auth.uid()
    )
  );

drop policy if exists campaigns_owner_insert on public.ai_campaigns;
create policy campaigns_owner_insert on public.ai_campaigns
  for insert with check (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = ai_campaigns.merchant_id and m.user_id = auth.uid()
    )
  );

drop policy if exists campaigns_owner_update on public.ai_campaigns;
create policy campaigns_owner_update on public.ai_campaigns
  for update using (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = ai_campaigns.merchant_id and m.user_id = auth.uid()
    )
  );

-- ai_agent_logs — owner read-only (service role inserts)
drop policy if exists agent_logs_owner_select on public.ai_agent_logs;
create policy agent_logs_owner_select on public.ai_agent_logs
  for select using (
    merchant_id is not null and exists (
      select 1 from public.merchant_profiles m
      where m.id = ai_agent_logs.merchant_id and m.user_id = auth.uid()
    )
  );

-- merchant_payments — owner read-only (provider webhooks insert via service role)
drop policy if exists payments_owner_select on public.merchant_payments;
create policy payments_owner_select on public.merchant_payments
  for select using (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = merchant_payments.merchant_id and m.user_id = auth.uid()
    )
  );

-- user_interest_events — authenticated users can insert their own events;
-- users can read only their own events. Anonymous events (user_id null) are
-- insert-only via service role.
drop policy if exists interest_insert_self on public.user_interest_events;
create policy interest_insert_self on public.user_interest_events
  for insert with check (auth.uid() = user_id);

drop policy if exists interest_select_self on public.user_interest_events;
create policy interest_select_self on public.user_interest_events
  for select using (auth.uid() = user_id);

-- ============================================================================
-- End of migration 003
-- ============================================================================
