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
   - Run `supabase/migrations/001_base_schema.sql`
   - Run `supabase/migrations/002_ugc_compliance.sql`
   - Run `supabase/storage.sql`
   - Run `supabase/seed.sql`
5. Restart Expo. The console will no longer log mock mode.

Supabase mode now powers auth, profiles, Taste Passport persistence, restaurant
reads, check-ins, saved restaurants, rewards, invites, image storage, reporting,
blocking, and account deletion. Without Supabase env vars, the app still runs in
mock mode with local mock data.

For EAS builds, create project secrets instead of hardcoding credentials in
`eas.json`:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY
```

> ⚠️ **Never commit `.env` to git.** It is already in `.gitignore`.
