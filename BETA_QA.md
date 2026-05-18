# CraveMap / 好吃GO — Internal Beta QA Checklist

**Build:** `v1.0.0-beta.1`
**Distribution:** TestFlight (iOS) / EAS Internal (Android)
**Backend modes:** Supabase (default if env vars are set) · Mock (offline / no env vars)

---

## How to install

### iOS (TestFlight)
1. Accept the TestFlight invite emailed to you.
2. Install the **TestFlight** app from the App Store.
3. Open the invite link → tap **Accept** → **Install**.
4. Launch **CraveMap** from your home screen.

### Android (EAS Internal)
1. Click the EAS share link in your invite email.
2. Tap **Download** to get the APK.
3. Install it (you may need to allow installs from unknown sources).
4. Launch **CraveMap**.

---

## Tester Checklist

For each item: ✅ works as expected · ⚠️ works but rough · ❌ broken. Add notes / screenshots in the bug template at the bottom.

### A. Onboarding

- [ ] Cold launch shows splash → onboarding/welcome
- [ ] Sign up with email + password creates an account
- [ ] Taste Passport multi-step flow completes
- [ ] Mascot appears with correct persona after passport completion
- [ ] Tapping the mascot triggers a small bounce
- [ ] After completion, app routes into `/(tabs)/home`

### B. Home tab

- [ ] City picker shows current city
- [ ] Restaurant cards load with images, name, taste-match %, price
- [ ] Tap a card → opens Restaurant Detail
- [ ] Pull-to-refresh (if present) updates the list

### C. Map tab

- [ ] First entry asks for **Location permission** (one-time prompt)
- [ ] If granted: blue user-location dot appears
- [ ] Markers render for visible restaurants
- [ ] **Clusters** (orange circles with numbers) appear when zoomed out
- [ ] Tapping a cluster zooms in to expand markers
- [ ] Tapping a marker opens the preview card; close (×) dismisses it
- [ ] **Recenter FAB** (bottom-right): tapping bounces, then flies map back to user location (or restaurant centroid if no location)
- [ ] Manually panning the map cancels auto-recenter; tapping FAB resumes it
- [ ] Map / list toggle works
- [ ] Filters and sorts apply correctly

### D. Saved tab

- [ ] Empty state shows when nothing is saved
- [ ] Tapping bookmark on Restaurant Detail adds to Saved
- [ ] Returning to Saved tab **immediately reflects the change** (refresh-on-focus)
- [ ] Tap the bookmark icon on a Saved card to remove → disappears from list

### E. Restaurant Detail

- [ ] Image carousel scrolls through restaurant photos
- [ ] Bookmark toggles persist on return to the screen
- [ ] "From people who've actually been" feed loads check-ins
- [ ] Check-ins reveal with a **staggered fade-in** (one row at a time)
- [ ] Check-ins posted today show a **NEW** pill + sparkle animation
- [ ] Tapping the thumbs-up:
  - bounces the icon
  - increments the count by 1
  - locks (can't double-tap to inflate)
  - persists across screen visits (already-marked icons render filled)
- [ ] Open in Maps button launches Apple/Google Maps with the address

### F. Check-in flow

- [ ] "+" / Check-in button opens the modal
- [ ] Step 1: restaurant selector
- [ ] Step 2: photo picker — **camera permission** prompt fires once
- [ ] Step 3: review text, taste/diet/scene tags
- [ ] Step 4: Worth-it / Overhyped / Not-sure
- [ ] Step 5: Submit
- [ ] Success modal shows mascot + sparkles
- [ ] After dismiss, Restaurant Detail shows the new check-in with **NEW** highlight
- [ ] Rewards screen Founding Scout progress updates (refresh-on-focus)

### G. Rewards screen

- [ ] Loads with all 4 Founding Scout tasks
- [ ] Task rows reveal with **staggered** entrance
- [ ] Completed tasks have a green check + bouncier reveal
- [ ] Progress bar matches `completed / total`
- [ ] When all 4 are done: **Glow + Sparkles + pulsing Mascot** appear on the mascot card
- [ ] Persona-correct mascot is displayed
- [ ] Tapping the mascot bounces it

### H. Profile tab

- [ ] Avatar + name + city + persona render
- [ ] Stats row: **Check-ins / Saved / Verified** (Verified shows a green ✓ if any check-in is location-verified, else —)
- [ ] Taste Passport summary chips show your preferences
- [ ] **My Check-ins** menu opens a list of your posts
- [ ] **Edit Taste Passport** re-enters the onboarding flow
- [ ] **Invite Friends** creates a code, opens the share sheet with `cravemap://redeem?code=CRAVE-XXXXXX`
- [ ] **Redeem an invite code** input accepts a code and shows inline success/error
- [ ] **Sign out** clears the session (Supabase mode)

### I. Deep-link redemption

- [ ] Open an invite link `cravemap://redeem?code=CRAVE-XXXXXX` (paste into Messages, Notes, then tap)
- [ ] Cold-launch: app opens directly to `/redeem` and auto-attempts redemption
- [ ] Warm-launch (app already open): navigates to `/redeem` and shows result
- [ ] Success → confetti / 🎉 + "Go to My Profile" button
- [ ] Already-redeemed → friendly error message
- [ ] Self-invite → friendly error message

### J. My Check-ins

- [ ] Lists all your check-ins, newest first
- [ ] Refreshes on screen focus (after posting a new check-in elsewhere)
- [ ] Empty state CTA → "Post a Check-in"

---

## Expected mode behavior

| Feature | Mock mode (no env vars) | Supabase mode (env vars set) |
|---|---|---|
| Auth | Auto-logged-in as demo user `u001` | Real Supabase Auth (email/password) |
| Persistence | In-process only (resets on app reload) | Server-backed |
| Photo upload | Picker works, photos held in memory | Uploaded to Supabase Storage |
| Mark helpful | Atomic in-process Set | Atomic RPC, persisted |
| Invite redeem | Validates `CRAVE-` prefix only | Server validates code + flips `accepted_at` |
| Verified ✓ stat | Always — (no real check-ins) | Reflects `location_verified=true` rows |
| Map clustering | Works (visual) | Works (visual) |
| Map user location | Works if device permits | Same |

---

## Known limitations (acceptable for beta)

1. **Photo upload race** — If the check-in row inserts but some photo uploads fail, the row exists with the successful URLs and a `warning` is surfaced. The check-in is **not** lost; retrying photo upload separately is not yet implemented.
2. **"NEW" pill is date-based** — Check-ins posted today (UTC date) show the NEW pill. In late-evening LA the cutoff may cross before midnight local time.
3. **Map Recenter is manual** — No auto-recenter once you've panned. Tap the FAB to return.
4. **Long feeds** — `getAllCheckIns` caps at 100 rows. Per-restaurant feeds are uncapped (typically small).
5. **Web** — Map is replaced by a list placeholder. Mobile is the supported beta surface.
6. **iPhone home indicator** — Map FAB sits a few points above the bottom edge; not yet inset-aware.

---

## Bug report template

```
**Device:** iPhone 15 Pro / Pixel 8 / etc.
**OS:** iOS 18.x / Android 14
**Build:** v1.0.0-beta.1
**Mode:** Supabase / Mock
**Steps to reproduce:**
1.
2.
3.

**Expected:**
**Actual:**
**Screenshot / Screen recording:**
```

Send to: ax2183@nyu.edu
