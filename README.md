# CraveMap 好吃GO

**AI food discovery and restaurant growth platform.**

CraveMap connects food lovers with restaurants that actually fit their taste — and gives restaurant owners the AI tools to grow their business. Two sides, one platform.

---

## For Diners

Find restaurants matched to your taste, mood, budget, and lifestyle — not just the most-reviewed ones.

- **Taste Passport** — set your flavor profile once; get personalized matches forever
- **Mood & Budget Fit** — filter by vibe, price, and what you're in the mood for
- **Real Check-ins** — see honest verdicts ("Worth It / Overhyped") from people with your taste
- **City Map** — browse spots near you across NYC, LA, Bay Area, Seattle, and Boston
- **Invite-only beta** — 847 Founding Food Scouts in, 153 diner spots left

---

## For Restaurants — CraveMap Studio

Paste your menu. Get a full week of campaigns, customer insights, and dish recommendations — built for how restaurants actually market.

- **AI Menu Analysis** — dish positioning, pricing gaps, and customer fit from your menu text
- **7-Day Campaign Calendar** — ready-to-post captions, video scripts, and content ideas
- **Customer Insight Summary** — who's most likely to love your restaurant and what to say to bring them in
- **Recommendation Cards** — CraveMap surfaces your best dishes to nearby diners who match your vibe

Studio is in pilot. Free during early access.

---

## Quick Start

```bash
npm install
npx expo start
```

The app runs in **mock mode** by default — no backend required. You'll see `[CraveMap] Running in MOCK mode` in the console.

---

## Enable Supabase (optional)

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
4. Apply the SQL migrations in **Dashboard → SQL Editor**, in order:
   ```
   supabase/migrations/001_base_schema.sql
   supabase/migrations/002_ugc_compliance.sql
   supabase/migrations/003_studio_schema.sql
   supabase/migrations/004_studio_writes.sql
   supabase/storage.sql
   supabase/seed.sql
   ```
5. Restart Expo.

For EAS builds, use EAS secrets instead of `.env`:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## Enable CraveMap Studio AI (optional)

Studio runs in **demo mode** by default — no API key needed. Demo mode returns a realistic example analysis with a simulated delay.

To run live AI generation:

1. Get a Gemini API key at [aistudio.google.com](https://aistudio.google.com) → **Get API Key**
2. Add to `.env`:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
   ```

> ⚠️ **Security note:** `EXPO_PUBLIC_*` variables are inlined into the JavaScript bundle at build time. This is acceptable for hackathon / pilot builds but must be replaced with a Supabase Edge Function before wide distribution. See `src/services/studio/gemini.ts` for the migration path.

> ⚠️ **Never commit `.env` to git.** It is already in `.gitignore`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 + expo-router v6 |
| Language | TypeScript (strict) |
| UI | React Native 0.81 |
| Auth & DB | Supabase (Postgres + RLS) |
| Storage | Supabase Storage |
| Diner AI | OpenAI (taste matching) |
| Studio AI | Gemini 2.0 Flash (menu analysis, campaign generation) |
| Navigation | expo-router file-based routing |

---

## Project Structure

```
app/
  index.tsx              # entry — routes unauthenticated users to /role-select
  role-select.tsx        # diner vs. restaurant choice
  onboarding/            # diner onboarding (taste passport setup)
  (tabs)/                # diner main tabs (home, map, saved, profile)
  studio/
    index.tsx            # Studio marketing landing
    onboarding.tsx       # merchant onboarding (menu + restaurant info)
    dashboard.tsx        # Studio module hub
    analysis.tsx         # AI Menu Analyzer results
    campaign.tsx         # AI Campaign Generator (7-day calendar)

src/
  services/
    studio/
      gemini.ts          # Gemini REST client (callGeminiStructured<T>)
      menuAnalysis.ts    # MenuAnalysisOutput types + prompt
      campaignGeneration.ts  # ContentCalendarItem types + prompt
      runMenuAnalysis.ts     # analysis orchestrator (fetch → persist → log)
      runCampaignGeneration.ts  # campaign orchestrator
      merchantOnboarding.ts     # merchant profile upsert

supabase/
  migrations/
    001_base_schema.sql  # users, restaurants, check-ins, rewards
    002_ugc_compliance.sql
    003_studio_schema.sql  # merchant_profiles, ai_menu_analyses, ai_campaigns, logs
    004_studio_writes.sql  # INSERT policies for client-side hackathon build
```
