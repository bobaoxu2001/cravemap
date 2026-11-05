-- ============================================================================
-- CraveMap — Migration 006: Studio evidence RPC (hackathon dashboard)
-- ============================================================================
-- Adds a SECURITY DEFINER function that powers the Studio Evidence Dashboard
-- (a screenshot-friendly page proving CraveMap Studio is AI-operated with
-- real activity).
--
-- Why a function?
--   ai_agent_logs / merchant_profiles / ai_campaigns / merchant_payments all
--   have owner-scoped RLS — a signed-in merchant can only SELECT their own
--   rows. The Evidence Dashboard needs platform-wide aggregates, so we hide
--   the cross-merchant read behind a function that:
--     1. SECURITY DEFINER → bypasses caller's RLS scope.
--     2. Returns ONLY non-PII fields:
--        - No owner_email, owner_name, phone
--        - No input_snapshot, output_snapshot, raw_ai_output, raw_menu_text
--        - No external_payment_id
--     3. Caps each row list at 10.
--     4. Truncates campaign titles to 80 chars.
--
-- Granted to `authenticated` only — anonymous users cannot call it. The
-- merchant must at least sign in.
-- ============================================================================

create or replace function public.get_studio_evidence()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  result := jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'agent_runs',         count(*),
        'menu_analysis_runs', count(*) filter (where agent_name = 'menu-analyzer'),
        'campaign_runs',      count(*) filter (where agent_name = 'campaign-generator'),
        'success_runs',       count(*) filter (where status = 'success'),
        'failed_runs',        count(*) filter (where status = 'failed')
      )
      from public.ai_agent_logs
    ),
    'latest_agent_logs', (
      select coalesce(jsonb_agg(row order by created_at desc), '[]'::jsonb)
      from (
        select
          jsonb_build_object(
            'agent_name',  agent_name,
            'action_type', action_type,
            'status',      status,
            'model_used',  model_used,
            'provider',    provider,
            'latency_ms',  latency_ms,
            'created_at',  created_at
          ) as row,
          created_at
        from public.ai_agent_logs
        order by created_at desc
        limit 10
      ) sub
    ),
    'latest_merchants', (
      select coalesce(jsonb_agg(row order by created_at desc), '[]'::jsonb)
      from (
        select
          jsonb_build_object(
            'restaurant_name', restaurant_name,
            'city',            city,
            'cuisine_type',    cuisine_type,
            'created_at',      created_at
          ) as row,
          created_at
        from public.merchant_profiles
        order by created_at desc
        limit 10
      ) sub
    ),
    'latest_campaigns', (
      select coalesce(jsonb_agg(row order by created_at desc), '[]'::jsonb)
      from (
        select
          jsonb_build_object(
            'campaign_title', left(campaign_title, 80),
            'campaign_goal',  left(campaign_goal, 120),
            'created_at',     created_at
          ) as row,
          created_at
        from public.ai_campaigns
        order by created_at desc
        limit 10
      ) sub
    ),
    'revenue', (
      select jsonb_build_object(
        'total_cents',     coalesce(sum(amount_cents) filter (where payment_status = 'succeeded'), 0),
        'succeeded_count', count(*) filter (where payment_status = 'succeeded'),
        'paid_merchants',  count(distinct merchant_id) filter (where payment_status = 'succeeded'),
        'currency',        coalesce((select currency from public.merchant_payments order by created_at desc limit 1), 'USD')
      )
      from public.merchant_payments
    )
  );
  return result;
end;
$$;

-- Lock down execution to signed-in users.
revoke all on function public.get_studio_evidence() from public;
revoke all on function public.get_studio_evidence() from anon;
grant execute on function public.get_studio_evidence() to authenticated;

-- ============================================================================
-- End of migration 006
-- ============================================================================
