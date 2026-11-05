-- Client self-reports are pending, not verified revenue. Owner RLS remains
-- effective inside the evidence RPC; merchants cannot see other merchants.
alter table public.merchant_payments add column if not exists verified_at timestamptz;
drop policy if exists payments_owner_insert on public.merchant_payments;
create policy payments_owner_insert on public.merchant_payments
  for insert to authenticated with check (
    payment_status = 'pending' and verified_at is null and
    exists (select 1 from public.merchant_profiles m
            where m.id = merchant_payments.merchant_id and m.user_id = auth.uid())
  );

create or replace function public.get_studio_evidence()
returns jsonb
language plpgsql
security invoker
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
        'total_cents',     coalesce(sum(amount_cents) filter (where payment_status = 'succeeded' and verified_at is not null and currency = 'USD'), 0),
        'succeeded_count', count(*) filter (where payment_status = 'succeeded' and verified_at is not null and currency = 'USD'),
        'paid_merchants',  count(distinct merchant_id) filter (where payment_status = 'succeeded' and verified_at is not null and currency = 'USD'),
        'currency',        'USD'
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
