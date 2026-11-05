-- ============================================================================
-- CraveMap — Migration 002: UGC Compliance
-- ============================================================================
-- Adds:
--   • blocked_users   — per-user block list; filters content from blocked authors
--   • reports         — user-submitted content reports (spam, harassment, etc.)
--   • delete_account  — RPC to permanently delete a user's account + all data
--   • report_check_in — RPC to submit a content report
--   • block_user      — RPC to block another user
--   • get_blocked_ids — RPC to return the caller's blocked user IDs
--
-- Required for App Store compliance:
--   • Apple Guideline 1.2  — UGC apps must allow reporting + blocking
--   • Apple Guideline 5.1.1(v) — Account deletion must be available in-app
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.blocked_users (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists idx_blocked_by_blocker on public.blocked_users(blocker_id);

-- ---------------------------------------------------------------------------

do $$ begin
  create type report_reason as enum (
    'spam',
    'inappropriate',
    'harassment',
    'misinformation',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('pending', 'reviewed', 'actioned', 'dismissed');
exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  check_in_id  uuid references public.check_ins(id) on delete cascade,
  reason       report_reason not null,
  details      text,
  status       report_status default 'pending',
  created_at   timestamptz default now()
);

create index if not exists idx_reports_check_in on public.reports(check_in_id);
create index if not exists idx_reports_reporter on public.reports(reporter_id);
create index if not exists idx_reports_status on public.reports(status) where status = 'pending';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.blocked_users enable row level security;
alter table public.reports        enable row level security;

-- blocked_users: users manage their own block list only
drop policy if exists blocked_select_own on public.blocked_users;
create policy blocked_select_own on public.blocked_users
  for select using (auth.uid() = blocker_id);

drop policy if exists blocked_insert_own on public.blocked_users;
create policy blocked_insert_own on public.blocked_users
  for insert with check (auth.uid() = blocker_id);

drop policy if exists blocked_delete_own on public.blocked_users;
create policy blocked_delete_own on public.blocked_users
  for delete using (auth.uid() = blocker_id);

-- reports: users can insert and read their own reports; admins see all via service role
drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select using (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- RPC: delete_account
-- ---------------------------------------------------------------------------
-- Permanently deletes the authenticated user's account and ALL associated
-- data (profiles, check_ins, saved_restaurants, invites, etc.) via cascade.
-- Removing the auth.users row cascades to public.profiles (FK with ON DELETE
-- CASCADE), which cascades further through all child tables.
-- Runs as SECURITY DEFINER so the postgres role (superuser) can access
-- auth.users without a service-role key on the client.
-- ---------------------------------------------------------------------------
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated. You must be signed in to delete your account.';
  end if;

  -- Deleting from auth.users cascades to public.profiles (on delete cascade),
  -- which then cascades to check_ins, saved_restaurants, check_in_helpful,
  -- invites, blocked_users, and reports — leaving no orphan rows.
  delete from auth.users where id = v_user_id;
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant  execute on function public.delete_account() to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: report_check_in
-- ---------------------------------------------------------------------------
-- Submits a content report for a check-in. Idempotent per (reporter, check-in,
-- reason): a second report from the same user for the same reason is silently
-- ignored to avoid duplicate rows (still returns success).
-- ---------------------------------------------------------------------------
create or replace function public.report_check_in(
  p_check_in_id uuid,
  p_reason      report_reason,
  p_details     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'You must be signed in to report content.');
  end if;

  if p_check_in_id is null then
    return jsonb_build_object('success', false, 'error', 'Missing check-in id.');
  end if;

  if not exists (select 1 from public.check_ins where id = p_check_in_id) then
    return jsonb_build_object('success', false, 'error', 'Check-in not found.');
  end if;

  insert into public.reports (reporter_id, check_in_id, reason, details)
    values (v_user_id, p_check_in_id, p_reason, nullif(trim(coalesce(p_details, '')), ''))
    on conflict do nothing;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.report_check_in(uuid, report_reason, text) from public, anon;
grant  execute on function public.report_check_in(uuid, report_reason, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: block_user
-- ---------------------------------------------------------------------------
-- Adds a user to the caller's block list. Idempotent (on conflict do nothing).
-- ---------------------------------------------------------------------------
create or replace function public.block_user(p_blocked_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'You must be signed in to block a user.');
  end if;

  if p_blocked_id is null then
    return jsonb_build_object('success', false, 'error', 'Missing user id.');
  end if;

  if v_user_id = p_blocked_id then
    return jsonb_build_object('success', false, 'error', 'You cannot block yourself.');
  end if;

  insert into public.blocked_users (blocker_id, blocked_id)
    values (v_user_id, p_blocked_id)
    on conflict do nothing;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.block_user(uuid) from public, anon;
grant  execute on function public.block_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: get_blocked_user_ids
-- ---------------------------------------------------------------------------
-- Returns an array of user IDs blocked by the authenticated user.
-- The client uses this list to filter out blocked users' check-ins from feeds.
-- ---------------------------------------------------------------------------
create or replace function public.get_blocked_user_ids()
returns uuid[]
language sql
security definer
set search_path = public
as $$
  select coalesce(array_agg(blocked_id), '{}')
  from public.blocked_users
  where blocker_id = auth.uid();
$$;

revoke execute on function public.get_blocked_user_ids() from public, anon;
grant  execute on function public.get_blocked_user_ids() to authenticated;
