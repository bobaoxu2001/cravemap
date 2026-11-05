# CraveMap Beta — Supabase Project Configuration Checklist

Run through this checklist in order. Each item links to the dashboard path.

---

## 1. SQL — Apply schema + seed in order

Open **SQL Editor → New Query** and run each file as one query:

| Order | File | Purpose |
|---|---|---|
| 1 | `supabase/schema.sql` | Tables, RLS, triggers, RPCs, founding_scout_progress view |
| 2 | `supabase/seed.sql` | 32 restaurants with lat/lng |
| 3 | `supabase/storage.sql` | Buckets + RLS policies |
| 4 | `supabase/beta-test/01-beta-users.sql` | Tester1/2/3 auth users + profile passports |
| 5 | `supabase/beta-test/02-beta-content.sql` | Saved + check-ins (6 check-ins total) |

If step 4 errors on `auth.admin_create_user`, instead:
- Dashboard → **Authentication → Users → Add user → Create new user**
- Email: `tester1+beta@cravemap.app`, password `TestPass123!`, "Auto Confirm User" checked
- Repeat for tester2 and tester3
- Then run only the `update public.profiles ...` portion of `01-beta-users.sql`

---

## 2. Auth Settings

**Dashboard → Authentication → Providers → Email**

| Setting | Value for beta | Reason |
|---|---|---|
| Enable Email provider | ✅ ON | Required |
| Confirm email | **OFF** for beta · ON for prod | Beta testers sign in immediately |
| Secure email change | ON | Default |
| Mailer URLs | `http://localhost:8082`, `http://localhost:8083`, `http://localhost:8084` | Add all three tester ports |

**Dashboard → Authentication → URL Configuration**

| Setting | Value |
|---|---|
| Site URL | `cravemap://` |
| Additional Redirect URLs | `cravemap://redeem`, `http://localhost:8082`, `http://localhost:8083`, `http://localhost:8084`, `exp://localhost:8082`, `exp://localhost:8083`, `exp://localhost:8084` |

Verify (SQL):
```sql
select * from auth.config; -- shows mailer + site_url
```

---

## 3. Storage Buckets

**Dashboard → Storage**

After `storage.sql` runs, you should see three public buckets:

| Bucket | Public | Upload policy |
|---|---|---|
| `avatars` | ✅ | own folder (`<user_id>/...`) |
| `check-in-photos` | ✅ | own folder (`<user_id>/...`) |
| `restaurants` | ✅ | service-role only (admin) |

Verify (SQL):
```sql
select id, name, public from storage.buckets order by id;
select policyname, cmd from pg_policies where schemaname='storage' and tablename='objects';
```

Sanity test the upload policy (from the app while signed in as Tester1):
- Profile → change avatar → pick local image → should succeed
- The uploaded object should land at `avatars/<tester1-uuid>/avatar.jpg`

---

## 4. Realtime (Optional for beta)

If you want the feed to update without focus-refetch:

**Dashboard → Database → Replication**

Enable replication on:
- `public.check_ins`
- `public.check_in_helpful`
- `public.saved_restaurants`

Not required for the QA pass.

---

## 5. Environment Variables (per tester)

Each tester workspace needs its own `.env`:

```bash
# cravemap-tester1/.env (also tester2/, tester3/)
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key-here>
```

Restart Expo after editing `.env`:
```bash
CI=1 npx expo start --port <8082|8083|8084>
```

---

## 6. Verification — One-shot DB sanity check

After all SQL is applied, run this single query in SQL Editor:

```sql
select
  email,
  p.name,
  p.city,
  p.persona,
  p.check_in_count,
  p.saved_count,
  p.invite_count,
  fs.taste_passport,
  fs.three_check_ins,
  fs.verified_check_in,
  fs.two_invites
from auth.users u
join public.profiles p on p.id = u.id
join public.founding_scout_progress fs on fs.user_id = u.id
where email like 'tester%+beta@cravemap.app'
order by email;
```

Expected output:

| email | name | city | check_in_count | saved_count | three_check_ins | verified_check_in |
|---|---|---|---|---|---|---|
| tester1+beta@... | Alex Chen | New York City | 3 | 6 | true | true |
| tester2+beta@... | Mei Lin | Los Angeles | 1 | 3 | false | true |
| tester3+beta@... | David Park | Bay Area | 2 | 2 | false | true |

If any row is missing or counts are off, re-run `02-beta-content.sql` (idempotent).

---

## 7. Cross-User Invite Test

After all three testers have signed in once:

Run `supabase/beta-test/03-cross-user-invite-test.sql` section by section.

Expected outcomes per step are documented inline in the SQL file.

---

## 8. Roll back / clean up

To reset a tester for re-testing:

```sql
delete from public.check_ins where user_id = (select id from auth.users where email = 'tester1+beta@cravemap.app');
delete from public.saved_restaurants where user_id = (select id from auth.users where email = 'tester1+beta@cravemap.app');
delete from public.invites where inviter_id = (select id from auth.users where email = 'tester1+beta@cravemap.app');
-- Counters reset automatically via triggers.
```

To nuke everything (DESTRUCTIVE — does NOT touch auth.users):
```sql
truncate public.check_in_helpful, public.invites, public.saved_restaurants, public.check_ins restart identity cascade;
```
