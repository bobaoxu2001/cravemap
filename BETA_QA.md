# CraveMap / 好吃GO — Internal Beta QA Guide
**Version:** v1.0.0-beta.1 · **Date:** 2026-05-18 · **Distribution:** Internal only

---

## 1. Test Environment

| | Mock Mode | Supabase Mode |
|---|---|---|
| Trigger | No `.env` / env vars empty | `EXPO_PUBLIC_SUPABASE_URL` + `ANON_KEY` set |
| Auth | Auto-logged as demo user `u001` | Real email/password sign-up |
| Persistence | In-process only (resets on reload) | Server-backed |
| Platforms | iOS · Android · Web (list fallback) | iOS · Android |

**Test accounts:** Create fresh accounts per tester. Use `+tag` email aliases (e.g. `tester+1@example.com`) to isolate data.

---

## 2. Auth & Onboarding

**A. Sign up (Supabase mode)**
1. Launch app → Welcome screen appears
2. Tap **Sign Up** → enter email + password → confirm
3. Verify email if prompted (check inbox)
4. App routes to **Taste Passport**

**B. Taste Passport**
1. Complete all 5 steps (city, taste prefs, dislikes, diet needs, food scenes)
2. ✅ Mascot with correct persona appears at end
3. ✅ Tap mascot → small bounce animation fires
4. App routes to `/(tabs)/home`

**C. Sign out / Sign in**
1. Profile tab → scroll down → **Sign out**
2. ✅ Session clears, routed to Welcome
3. Sign back in → Profile shows same data

---

## 3. Home & Restaurant Discovery

1. Home loads restaurant cards with image, taste-match %, cuisine, price tier
2. Tap a card → Restaurant Detail opens
3. Swipe image carousel → dots advance
4. ✅ Open in Maps → launches Apple/Google Maps with address

---

## 4. Restaurant Detail — Check-in Feed

1. Scroll to "From people who've actually been"
2. ✅ Cards reveal with **staggered fade-in** (row-by-row)
3. Cards posted today show orange **NEW** pill + looping sparkle overlay
4. **Mark Helpful:** Tap thumbs-up on any card
   - ✅ Icon bounces, count +1, button locks
   - ✅ Navigate away and return → icon still shows filled (pre-fetched state)
   - ❌ Tapping again does nothing (locked — correct)

---

## 5. Check-in Creation

1. Restaurant Detail → **Check In** (primary button)
2. Step 1: confirm restaurant
3. Step 2: add up to 6 photos
   - First tap → **Photos permission** prompt (one-time)
   - Camera icon → **Camera permission** prompt (one-time)
   - HEIC/JPEG/PNG all accepted
4. Steps 3–5: review text, taste/diet/scene tags, hype rating
5. Submit → ✅ Success modal with mascot + sparkles
6. Dismiss → Restaurant Detail re-fetches; new check-in shows **NEW** pill

**Warning case:** If some photos fail to upload, a non-blocking warning appears. Check-in is still posted with successful photo URLs.

---

## 6. Saved Restaurants

1. Restaurant Detail → tap **bookmark** icon (top-right)
2. ✅ Saved tab immediately reflects change (refresh-on-focus)
3. Saved tab → tap bookmark on a card → removes from list instantly

---

## 7. My Check-ins

1. Profile → **My Check-ins** menu item
2. ✅ Lists all your check-ins, newest first
3. Post a new check-in → return → list refreshes automatically

---

## 8. Invite Creation & Redemption

**Create:**
1. Profile → **Invite Friends** → share sheet opens
2. Message contains `cravemap://redeem?code=CRAVE-XXXXXX` and the raw code

**Redeem — Profile input:**
1. Profile → scroll to "🎟️ Have an invite code?" → enter code → tap Redeem
2. ✅ Inline green success message appears
3. ❌ Own code → "You cannot redeem your own invite code"
4. ❌ Used code → "This invite code has already been redeemed"

**Redeem — Deep link:**
1. Tap `cravemap://redeem?code=CRAVE-XXXXXX` in Messages/Notes
2. ✅ App opens (or navigates) to `/redeem` screen
3. ✅ Auto-attempts redemption on mount; shows 🎉 on success
4. ✅ "Go to My Profile" CTA routes back

---

## 9. Rewards / Founding Scout Progress

1. Rewards tab → 4 task rows reveal with staggered animation
2. Completed tasks show green ✓ + bouncier spring
3. Progress bar fills proportionally
4. ✅ Complete all 4 tasks → **Glow halo + Sparkles + pulsing Mascot** appear
5. ✅ Tap the mascot → bounce animation fires
6. Return after posting a check-in → progress refreshes (refresh-on-focus)

**Founding Scout tasks:**
- Complete Taste Passport (50 pts)
- Post 3 check-ins (150 pts)
- Get 1 location-verified check-in (100 pts)
- Invite 2 friends (100 pts)

---

## 10. Map View

1. Map tab → first visit prompts **Location permission** (one-time)
2. ✅ Blue user-location dot appears if granted
3. ✅ Restaurant markers visible; **cluster badges** (orange circles + count) appear when zoomed out
4. Tap cluster → zooms in, expanding individual markers
5. Tap marker → preview card slides up (name, cuisine, neighborhood)
6. ✅ **Recenter FAB** (bottom-right): tap → button bounces → map flies to user location (or centroid if no GPS)
7. Pan map manually → Recenter FAB becomes the only way back (auto-recenter is disabled after a gesture — correct)
8. Map/List toggle → switches to filtered restaurant list
9. **Web:** Map tab shows list placeholder ("Map preview available on mobile") — correct

---

## 11. Profile — Verified Stat

1. Profile tab → stats row shows **Check-ins / Saved / Verified**
2. ✅ Verified shows green **✓** if any of your check-ins have `location_verified=true`
3. Shows **—** otherwise (fresh account expected)

---

## 12. Known Limitations (Do Not File as Bugs)

| # | Limitation | Workaround |
|---|---|---|
| 1 | Partial photo upload → `warning` toast | Check-in row is not lost; retry not yet implemented |
| 2 | **NEW** pill uses UTC date; may show for yesterday's check-in late at night | Cosmetic only |
| 3 | Map Recenter FAB is manual after any pan | Tap FAB to fly back |
| 4 | `getAllCheckIns` capped at 100 rows | Per-restaurant feeds uncapped |
| 5 | Map FAB not inset-aware (sits a few pt above home bar on iPhone) | Cosmetic only |
| 6 | Web: no map, no camera, no native permissions | Use iOS/Android for full testing |

---

## 13. Edge Cases to Specifically Test

- **Duplicate mark helpful:** Tap thumbs-up twice → count only increments once ✅
- **Self-invite redemption:** Enter your own invite code → friendly error, no crash ✅
- **Already-redeemed code:** Use a code that was already used → friendly error ✅
- **Offline (no network, Supabase mode):** App should surface error states, not crash
- **Permission denied (location/camera):** Map/check-in still works, just without that feature ✅
- **Cold-launch deep link:** Open `cravemap://redeem?code=...` with app closed → app opens to `/redeem` ✅
- **Empty states:** New account, no saved spots, no check-ins — all show friendly prompts ✅

---

## 14. Bug Report Template

```
Device: iPhone 15 / Pixel 8 / etc.
OS: iOS 18.x / Android 14
Build: v1.0.0-beta.1
Mode: Supabase / Mock
Steps to reproduce:
1.
2.
Expected:
Actual:
Screenshot / Recording: [attach]
```

**Send to:** ax2183@nyu.edu
