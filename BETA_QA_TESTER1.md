# CraveMap / 好吃GO — Tester1 Beta QA Report
**Version:** v1.0.0-beta.1 · **Date:** 2026-05-18 · **Branch:** beta-tester-1
**Tester:** Tester1 · **Mode:** Mock (USE_SUPABASE=false)
**Expo port:** 8082 · **Workspace:** cravemap-tester1/

---

## Environment

| Item | Value |
|---|---|
| Workspace | `/cravemap-tester1` |
| Branch | `beta-tester-1` (from `origin/main` @ `876c724`) |
| Mode | Mock (EXPO_PUBLIC_SUPABASE_URL empty) |
| Expo port | 8082 |
| Node | $(node -v 2>/dev/null) |
| Expo SDK | ~54.0.33 |
| React Native | 0.81.5 |

---

## How to Switch Modes

**Mock mode (current):** `.env` has empty Supabase vars → `isSupabaseConfigured()` returns `false`.

**Supabase mode:** Populate `.env` with real credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
Then restart `npx expo start --port 8082`.

---

## Launch Instructions

```bash
cd cravemap-tester1
CI=1 npx expo start --port 8082
# iOS Simulator: press i
# Android Simulator: press a
# Web: press w
```

---

## QA Checklist

> Status legend: ✅ Pass · ❌ Fail · ⚠️ Partial · ⬜ Not yet tested

### 1. Auth & Onboarding (Mock mode: auto-logs as demo user u001)

| # | Test case | Status | Notes |
|---|---|---|---|
| 1.1 | Launch → Welcome screen appears | ⬜ | |
| 1.2 | Taste Passport — all 5 steps complete | ⬜ | |
| 1.3 | Mascot with correct persona appears at end | ⬜ | |
| 1.4 | Tap mascot → bounce animation fires | ⬜ | |
| 1.5 | App routes to `/(tabs)/home` after onboarding | ⬜ | |
| 1.6 | Sign out → session clears, routes to Welcome | ⬜ | |
| 1.7 | Sign in → Profile shows same data | ⬜ | |

---

### 2. Home & Restaurant Discovery

| # | Test case | Status | Notes |
|---|---|---|---|
| 2.1 | Home loads restaurant cards (image, match%, cuisine, price) | ⬜ | |
| 2.2 | Tap card → Restaurant Detail opens | ⬜ | |
| 2.3 | Swipe image carousel → dots advance | ⬜ | |
| 2.4 | Open in Maps → launches Apple/Google Maps | ⬜ | |

---

### 3. Check-in Feed (Restaurant Detail)

| # | Test case | Status | Notes |
|---|---|---|---|
| 3.1 | Feed cards reveal with staggered fade-in | ⬜ | |
| 3.2 | Cards posted today show orange NEW pill + sparkle overlay | ⬜ | |
| 3.3 | Mark Helpful: icon bounces, count +1, button locks | ⬜ | |
| 3.4 | Navigate away and return → icon still shows filled | ⬜ | |
| 3.5 | Duplicate tap → count only increments once (locked) | ⬜ | |

---

### 4. Check-in Creation

| # | Test case | Status | Notes |
|---|---|---|---|
| 4.1 | Restaurant Detail → Check In button visible | ⬜ | |
| 4.2 | Step 1: confirm restaurant | ⬜ | |
| 4.3 | Step 2: add photos (up to 6) | ⬜ | |
| 4.4 | Photos permission prompt on first tap | ⬜ | |
| 4.5 | Camera permission prompt on camera icon | ⬜ | |
| 4.6 | Steps 3–5: review text, tags, hype rating | ⬜ | |
| 4.7 | Submit → success modal with mascot + sparkles | ⬜ | |
| 4.8 | Dismiss → Restaurant Detail re-fetches, new check-in shows NEW pill | ⬜ | |
| 4.9 | Partial photo failure → non-blocking warning, check-in still posts | ⬜ | |

---

### 5. Saved Restaurants

| # | Test case | Status | Notes |
|---|---|---|---|
| 5.1 | Bookmark icon on Restaurant Detail saves restaurant | ⬜ | |
| 5.2 | Saved tab immediately reflects change | ⬜ | |
| 5.3 | Unsave from Saved tab → removes from list instantly | ⬜ | |

---

### 6. My Check-ins

| # | Test case | Status | Notes |
|---|---|---|---|
| 6.1 | Profile → My Check-ins lists all check-ins, newest first | ⬜ | |
| 6.2 | Post new check-in → return → list refreshes | ⬜ | |

---

### 7. Invite Creation & Redemption

| # | Test case | Status | Notes |
|---|---|---|---|
| 7.1 | Profile → Invite Friends → share sheet opens | ⬜ | |
| 7.2 | Message contains `cravemap://redeem?code=CRAVE-XXXXXX` | ⬜ | |
| 7.3 | Profile → enter invite code → tap Redeem → green success msg | ⬜ | |
| 7.4 | Own code → "You cannot redeem your own invite code" error | ⬜ | |
| 7.5 | Used code → "This invite code has already been redeemed" error | ⬜ | |
| 7.6 | Deep link `cravemap://redeem?code=...` opens /redeem screen | ⬜ | |
| 7.7 | Deep link → auto-attempts redemption → shows 🎉 on success | ⬜ | |
| 7.8 | "Go to My Profile" CTA routes back | ⬜ | |

---

### 8. Rewards / Founding Scout

| # | Test case | Status | Notes |
|---|---|---|---|
| 8.1 | Rewards tab → 4 task rows with staggered animation | ⬜ | |
| 8.2 | Completed tasks show green ✓ + bouncier spring | ⬜ | |
| 8.3 | Progress bar fills proportionally | ⬜ | |
| 8.4 | All 4 tasks complete → Glow halo + Sparkles + pulsing Mascot | ⬜ | |
| 8.5 | Tap mascot → bounce animation fires | ⬜ | |
| 8.6 | Return after check-in → progress refreshes on focus | ⬜ | |

---

### 9. Map View

| # | Test case | Status | Notes |
|---|---|---|---|
| 9.1 | Map tab → Location permission prompt on first visit | ⬜ | |
| 9.2 | Blue user-location dot appears if location granted | ⬜ | |
| 9.3 | Restaurant markers visible | ⬜ | |
| 9.4 | Cluster badges appear when zoomed out | ⬜ | |
| 9.5 | Tap cluster → zooms in, individual markers expand | ⬜ | |
| 9.6 | Tap marker → preview card slides up | ⬜ | |
| 9.7 | Recenter FAB tapped → bounces → map flies to user location | ⬜ | |
| 9.8 | Pan map → Recenter FAB is only way back (auto-recenter disabled) | ⬜ | |
| 9.9 | Map/List toggle → switches to restaurant list | ⬜ | |
| 9.10 | Web: Map tab shows "Map preview available on mobile" placeholder | ⬜ | |

---

### 10. Profile — Verified Stat

| # | Test case | Status | Notes |
|---|---|---|---|
| 10.1 | Stats row shows Check-ins / Saved / Verified | ⬜ | |
| 10.2 | Verified shows green ✓ if any check-in has `location_verified=true` | ⬜ | |
| 10.3 | Fresh account shows — for Verified | ⬜ | |

---

### 11. Edge Cases

| # | Test case | Status | Notes |
|---|---|---|---|
| 11.1 | Duplicate mark helpful → count increments only once | ⬜ | |
| 11.2 | Self-invite redemption → friendly error, no crash | ⬜ | |
| 11.3 | Already-redeemed code → friendly error, no crash | ⬜ | |
| 11.4 | Offline (Supabase mode): error states shown, no crash | ⬜ | N/A in Mock mode |
| 11.5 | Location permission denied → Map/check-in still works | ⬜ | |
| 11.6 | Camera permission denied → check-in still works (no photo) | ⬜ | |
| 11.7 | Cold-launch deep link `cravemap://redeem?code=...` → opens /redeem | ⬜ | |
| 11.8 | Empty states (no saved, no check-ins) → friendly prompts | ⬜ | |

---

### 12. Mock vs Supabase Mode Independence

| # | Test case | Status | Notes |
|---|---|---|---|
| 12.1 | Mock mode: app runs without any Supabase env vars | ⬜ | |
| 12.2 | Mock mode: console log shows `[CraveMap] Running in MOCK mode` | ⬜ | |
| 12.3 | Supabase mode: populating .env + restart → real auth used | ⬜ | Requires Tester1 Supabase project |
| 12.4 | Switching modes requires only .env change + restart | ⬜ | |

---

## Bug Reports

*Use the template below for each bug found. Copy and fill in as many as needed.*

---

### Bug #001

```
Device:
OS:
Build: v1.0.0-beta.1
Mode: Mock / Supabase
Steps to reproduce:
1.
2.
Expected:
Actual:
Screenshot / Recording: [attach]
```

---

## Notes & Observations

*(Free-form notes from the test session)*

---

## Session Summary

- **Date tested:**
- **Duration:**
- **Platforms tested:** iOS Simulator / Android Simulator / Web
- **Total tests:** 60
- **Passed (✅):** 0
- **Failed (❌):** 0
- **Partial (⚠️):** 0
- **Not tested (⬜):** 60
- **Bugs filed:** 0

**Send report to:** ax2183@nyu.edu
