-- ============================================================================
-- CraveMap / 好吃GO — Storage Buckets & Policies
-- ============================================================================
-- Apply AFTER schema.sql.
-- Run in Supabase SQL Editor.
-- Buckets:
--   avatars           — user profile pictures
--   check-in-photos   — photos attached to check-ins
--   restaurants       — restaurant header images (admin-managed)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('check-in-photos', 'check-in-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('restaurants', 'restaurants', true)
on conflict (id) do nothing;

-- Public read for all three buckets
drop policy if exists "Public read" on storage.objects;
create policy "Public read" on storage.objects for select
  using (bucket_id in ('avatars', 'check-in-photos', 'restaurants'));

-- Users can upload to their own folder in avatars
drop policy if exists "Avatar upload own" on storage.objects;
create policy "Avatar upload own" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar update own" on storage.objects;
create policy "Avatar update own" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar delete own" on storage.objects;
create policy "Avatar delete own" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload to their own folder in check-in-photos
drop policy if exists "Check-in photo upload own" on storage.objects;
create policy "Check-in photo upload own" on storage.objects for insert
  with check (
    bucket_id = 'check-in-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Check-in photo delete own" on storage.objects;
create policy "Check-in photo delete own" on storage.objects for delete
  using (
    bucket_id = 'check-in-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- restaurants bucket: no client write access. Use service role for admin uploads.
