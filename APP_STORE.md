# CraveMap — App Store Listing Assets
> Fill this into App Store Connect before submitting for review.
> Sections marked ⚠️ need your input before use.

---

## iOS App Identity

| Field | Value |
|---|---|
| **Bundle ID** | `com.cravemap.app` |
| **App Name** | `CraveMap – Local Food Discovery` (30 chars ✓) |
| **Subtitle** | `Find spots loved by locals` (26 chars ✓) |
| **Category** | Food & Drink (Primary) · Lifestyle (Secondary) |
| **Age Rating** | 12+ (user-generated content, no violent/adult content) |
| **Content Rights** | No third-party content requiring permissions |
| **Price** | Free |
| **Copyright** | © 2026 CraveMap |

---

## App Description (4000 char max — paste into "Description" field)

```
CraveMap is the food discovery app built for people who actually care about what they eat.

Instead of star ratings from strangers, CraveMap shows you restaurants through the eyes of people who share your taste — your Taste Passport matches you with spots that fit your flavor profile, dietary needs, and the kind of food experience you're after.

🗺 DISCOVER YOUR CITY'S BEST SPOTS
Browse curated restaurants across New York City, Los Angeles, Bay Area, Seattle, and Boston. Every listing includes taste-match scores, verified local check-ins, and real photos from real visits.

✍️ CHECK IN AFTER YOUR VISIT
Share a quick review after dining — photos, taste tags, and your honest "Worth It / Overhyped / Not Sure" verdict. Your check-ins help others in your city find the real gems.

🎯 YOUR TASTE PASSPORT
Complete a short taste setup on first launch. CraveMap uses your preferences, dietary needs, and food-scene interests to rank restaurants uniquely for you.

🗺 INTERACTIVE MAP
Find restaurants near you on a live map with clustering, your GPS location, and instant detail cards. No sign-in required to browse.

🔖 SAVE YOUR HIT LIST
Bookmark spots you want to try and revisit them anytime from your Saved tab — even offline.

👥 INVITE FRIENDS
Share invite codes with friends and track your Founding Scout progress as your network grows.

---

CraveMap is currently in beta, covering 5 major US cities. More cities coming soon.

For support: ax2183@nyu.edu
```

---

## Promotional Text (170 char — shown above description, can change without review)

```
Now live in NYC, LA, Bay Area, Seattle & Boston. Discover restaurants matched to your taste — not just the most-reviewed ones.
```
(125 chars ✓)

---

## Keywords (100 chars, comma-separated, no spaces after commas)

```
food,restaurant,local,discovery,map,dining,review,chinese food,taste,foodie,spots,eat,NYC,LA
```
(93 chars ✓)

**Notes:**
- Don't repeat words already in the App Name ("CraveMap", "Local", "Food", "Discovery")
- Apple counts the name + subtitle + keywords for search indexing
- Localise keywords per market if you expand internationally

---

## What's New (first release)

```
Welcome to CraveMap v1.0! Discover restaurants matched to your taste across 5 US cities, share check-ins after your visits, and build your food hit list.
```

---

## App Store Icon

- **File:** `assets/icon.png`
- **Required size:** 1024×1024 px, PNG, no alpha channel, no rounded corners (Apple adds them)
- ⚠️ Verify the icon PNG has **no transparency** — Apple will reject it if it does:
  ```bash
  file assets/icon.png   # should say "PNG image data, 1024 x 1024"
  python3 -c "from PIL import Image; img=Image.open('assets/icon.png'); print(img.mode)"  # should be "RGB" not "RGBA"
  ```

---

## Screenshots

Apple requires at least **one 6.7" iPhone screenshot**. iPad required because `supportsTablet: true`.

| Device | Resolution | Required? |
|---|---|---|
| iPhone 6.7" (15 Pro Max) | 1290 × 2796 | ✅ Required |
| iPhone 6.5" (14 Plus) | 1284 × 2778 | Optional (legacy) |
| iPad Pro 13" (M4) | 2064 × 2752 | ✅ Required (tablet enabled) |
| iPad Pro 12.9" (6th gen) | 2048 × 2732 | Optional (legacy) |

### Recommended screenshot sequence (5 screenshots):

1. **Home tab** — restaurant cards with taste-match badges, greeting header
   - Caption: "Restaurants matched to your taste"
2. **Restaurant Detail** — image carousel + stats + "Worth It" verdict card
   - Caption: "Real reviews from people who've been"
3. **Map tab** — clustered markers, location dot, filter chips
   - Caption: "Find spots near you on the map"
4. **Check-in flow** — Step 3 (tags + review) or Success modal with mascot
   - Caption: "Share your visit in 60 seconds"
5. **Profile / Rewards** — Founding Scout progress + persona mascot
   - Caption: "Earn Scout badges as you explore"

### How to take screenshots:
```bash
# iOS Simulator (6.7"):
# 1. Open Xcode → Simulator → iPhone 15 Pro Max
# 2. Run the app: npx expo start --ios
# 3. Navigate to each screen, press Cmd+S to save screenshot
# 4. Scale to 1290×2796 if needed

# Or use a service like AppScreener / Rottenwood / Previewed.app
```

---

## Privacy Nutrition Label

Fill these in App Store Connect under **App Privacy → Data Types**:

| Data Type | Collected? | Linked to User? | Tracking? |
|---|---|---|---|
| Email Address | ✅ Yes | ✅ Yes | ❌ No |
| Name | ✅ Yes (display name) | ✅ Yes | ❌ No |
| Photos or Videos | ✅ Yes (check-in photos) | ✅ Yes | ❌ No |
| Precise Location | ❌ No | — | ❌ No |
| Coarse Location | ✅ Yes (city-level for map) | ✅ Yes | ❌ No |
| User Content | ✅ Yes (reviews, check-ins) | ✅ Yes | ❌ No |
| Identifiers (User ID) | ✅ Yes | ✅ Yes | ❌ No |
| Crash Data | ✅ Yes | ❌ No | ❌ No |
| Performance Data | ✅ Yes | ❌ No | ❌ No |

**Purposes for linked data:** App Functionality, Product Personalisation
**No data is used for tracking or advertising.**

---

## Age Rating Questionnaire

Answer these in App Store Connect → App Information → Age Rating:

| Question | Answer |
|---|---|
| Cartoon or fantasy violence | No |
| Realistic violence | No |
| Sexual content or nudity | No |
| Profanity or crude humour | No |
| Horror / fear-based content | No |
| Medical / treatment info | No |
| Alcohol / tobacco / drugs | No (food app, no alcohol promotion) |
| Gambling | No |
| Contests | No |
| **User-generated content** | **Yes** |
| **Unrestricted web access** | **No** |
| **Social networking** | **No** |

→ Result: **12+** (due to user-generated content)

---

## App Review Information

| Field | Value |
|---|---|
| **First name** | ⚠️ Your name |
| **Last name** | ⚠️ Your name |
| **Phone** | ⚠️ Your phone (US number recommended) |
| **Email** | ax2183@nyu.edu |
| **Demo account username** | ⚠️ Create a Supabase test account: `reviewer@cravemap-test.com` |
| **Demo account password** | ⚠️ Set a password, write it here |
| **Notes** | The app supports both Mock mode (no login needed) and Supabase mode. The demo account logs into Supabase mode. To test Mock mode: delete the app and reinstall without signing in — it auto-logs in as a demo user. Map requires location permission; tap "Allow While Using App" to see the map. |

---

## Support & Privacy URLs

| Field | URL | Notes |
|---|---|---|
| **Support URL** | ⚠️ `https://cravemap.app/support` OR `mailto:ax2183@nyu.edu` | Apple accepts mailto links |
| **Privacy Policy URL** | ⚠️ Host the privacy policy at a public URL | See `PRIVACY_POLICY.md` for the content |
| **Marketing URL** | Optional | Your website or landing page |

### Easy hosting options for Privacy Policy:
1. **GitHub Pages** — push `PRIVACY_POLICY.md` as `index.html` to a `gh-pages` branch
2. **Notion** — paste the text, publish as public page, copy URL
3. **Carrd** — free single-page site builder
4. **Your own domain** — `https://cravemap.app/privacy`

---

## EAS Production Build Commands

```bash
# 1. Set production Supabase credentials as EAS secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://YOUR-PRODUCTION-PROJECT.supabase.co"

eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "YOUR-PRODUCTION-ANON-KEY"

# 2. Run the production iOS build
eas build --profile production --platform ios --non-interactive

# 3. Submit to App Store Connect (TestFlight → Pending Developer Release)
eas submit --platform ios --latest

# 4. In App Store Connect:
#    - Fill in all the metadata above
#    - Upload screenshots
#    - Set pricing to Free
#    - Fill Privacy Nutrition Labels
#    - Add the build from TestFlight
#    - Submit for review
```

---

## Pre-Submission Checklist

- [ ] `app.json` version is `1.0.0`, buildNumber is `1`
- [ ] Privacy Policy is hosted at a public HTTPS URL
- [ ] App Store Connect app record created with Bundle ID `com.cravemap.app`
- [ ] Screenshots uploaded (6.7" iPhone + iPad Pro 13")
- [ ] Privacy Nutrition Labels filled
- [ ] Age rating questionnaire completed (→ 12+)
- [ ] App Review demo account created and credentials entered
- [ ] Support URL filled (at minimum `mailto:ax2183@nyu.edu`)
- [ ] Production EAS secrets set
- [ ] Production build submitted to TestFlight
- [ ] Build added to App Store version in App Store Connect
- [ ] All metadata fields complete (name, subtitle, description, keywords, promotional text)
- [ ] Content Rights declaration complete
