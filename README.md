## Supabase Setup

The app runs in **mock mode** by default — no backend required.

### Run in mock mode (default)
```bash
npm install
npx expo start
```

You will see `[CraveMap] Running in MOCK mode` in the console.

### Enable Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in your Supabase credentials from **Dashboard → Settings → API**:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```
4. Apply the Supabase SQL files in **Dashboard → SQL Editor**, in this order:
   - Run `supabase/schema.sql`
   - Run `supabase/storage.sql`
   - Run `supabase/seed.sql`
5. Restart Expo. The console will no longer log mock mode.

Restaurant reads are the first Supabase-backed content feature. Auth, profiles,
and Taste Passport persistence use Supabase when env vars are configured;
restaurants then load from `public.restaurants`. Without Supabase env vars, the
app still runs fully in mock mode with the local mock data.

> ⚠️ **Never commit `.env` to git.** It is already in `.gitignore`.
