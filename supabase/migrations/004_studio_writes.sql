-- ============================================================================
-- CraveMap — Migration 004: Studio client-side writes + extra analysis columns
-- ============================================================================
-- Migration 003 set up ai_menu_analyses and ai_agent_logs as owner-read-only,
-- assuming writes would happen via a service-role Edge Function. For the
-- hackathon build the agent currently runs client-side (matching the existing
-- EXPO_PUBLIC_* pattern used for OpenAI), so the owner needs INSERT access
-- on their own rows.
--
-- Also adds two analysis columns surfaced by the result screen:
--   • content_angles — marketing angle ideas
--   • risks          — risks and missing-information notes
--
-- When the agent moves to a Supabase Edge Function (recommended for prod),
-- these INSERT policies can be tightened by dropping them — service-role
-- bypasses RLS.
-- ============================================================================

-- ── New analysis columns ────────────────────────────────────────────────────
alter table public.ai_menu_analyses
  add column if not exists content_angles jsonb default '[]'::jsonb;

alter table public.ai_menu_analyses
  add column if not exists risks jsonb default '[]'::jsonb;

-- ── INSERT policies: owner can write logs/analyses for their own merchant ───

drop policy if exists menu_analyses_owner_insert on public.ai_menu_analyses;
create policy menu_analyses_owner_insert on public.ai_menu_analyses
  for insert with check (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = ai_menu_analyses.merchant_id and m.user_id = auth.uid()
    )
  );

drop policy if exists agent_logs_owner_insert on public.ai_agent_logs;
create policy agent_logs_owner_insert on public.ai_agent_logs
  for insert with check (
    -- merchant_id may be null for platform-level runs, but a client write
    -- must always be attributable to the caller's merchant.
    merchant_id is not null and exists (
      select 1 from public.merchant_profiles m
      where m.id = ai_agent_logs.merchant_id and m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- End of migration 004
-- ============================================================================
