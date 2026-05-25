# Cuisine + Diet Expansion Shortlist

> Status: **proposal — needs your approval before any rows enter `data/mockRestaurants.ts` or `supabase/seed.sql`.**
>
> Why this exists: the current 32-restaurant catalogue is 10 Chinese, 4 Vietnamese, 3 Japanese, 2 each of Thai/Korean/Mexican/Malaysian/Indian, 1 American/Greek/Italian/Mediterranean. The App Description promises "5 major US cities" but the experience reads as "Asian food in 5 US cities." Also `diet-approved` is only on 2/32 restaurants, which breaks the onboarding promise to vegan/vegetarian/halal users.
>
> The restaurants below are **real, well-known places** anyone in those cities would recognize. They are not invented. They still need your review for:
>
> 1. **Personal endorsement** — do you (or your beta scouts) actually rate these as worth recommending? CraveMap's whole pitch is "not random Yelp." If you've never been, don't endorse blindly.
> 2. **Insider tip authoring** — for the rows we accept, someone has to write the real insider tips. I can draft from general knowledge but you should verify they're true.
> 3. **Photos** — `loremflickr` is fine for beta but real visit photos are better.
>
> **Process:** strike through anything you don't want. Add anything I missed. Then say "approve" and I'll write the TS + SQL rows.

---

## P0 — Cuisine diversity (non-Asian)

### New York City (currently 10 Asian, 0 non-Asian)

**Italian**
- **Lucali** — Brooklyn, Carroll Gardens. Wood-fired thin-crust pizza, BYOB, no reservations. The line is real but so is the pizza.
- **Via Carota** — West Village. Italian by Jody Williams + Rita Sodi. Cash-only-ish small-plates institution. Date-night warhorse.
- **Roberta's** — Bushwick. Pizza + Bowery hipster ambience. Tourist-trap risk but the pizza holds.

**American / Diner**
- **Russ & Daughters** — Lower East Side. 100+ years of Jewish appetizing. Bagels + lox is the move.
- **Katz's Delicatessen** — LES. Pastrami sandwich, the one tourist trap that's also actually good.
- **Joe's Pizza** — Greenwich Village. $4 slice. The single greatest cheap-eat in NYC.

**Mediterranean / Levantine**
- **Miss Ada** — Fort Greene. Israeli/Levantine. Hummus, lamb kebab, hidden-garden vibe.
- **Shukette** — Chelsea. Israeli small plates, lively bar vibe, group dinner.

**Mexican (non-tacos)**
- **Casa Enrique** — Long Island City. Chiapas-style Mexican, Michelin-starred but $$, not gimmicky.

### Los Angeles (currently 7 Asian, 1 American Nashville chicken)

**Italian**
- **Bestia** — Arts District. Arguably the city's best Italian for the past decade. Reservation-only.
- **Jon & Vinny's** — Fairfax. Pizza + Italian, casual. Hard to get into.
- **Pizzeria Mozza** — Hancock Park. Nancy Silverton's room. Pizza institution.

**Mediterranean / Levantine**
- **Bavel** — Arts District. Levantine. Same team as Bestia. Some say better.
- **Kismet** — Los Feliz. Middle Eastern with California ingredient hand. Excellent brunch.

**American / Brunch**
- **Sqirl** — Silver Lake. Famous toast + jam. Brunch-only, divisive owner history (worth knowing before endorsing).
- **Republique** — Mid-City. French-Cal bakery + dinner. Cathedral-ceiling room.

**Mexican (sit-down, not tacos)**
- **Guelaguetza** — Koreatown. Best Oaxacan in the country. Mole negro is the move.

### Bay Area (currently 5 Asian, 1 Indian Fusion)

**Italian**
- **Flour + Water** — Mission, SF. Pasta-driven, reliably excellent. Group-dinner staple.
- **Cotogna** — Jackson Square, SF. Quince family. Wood-fired Italian.

**American / California**
- **Zuni Café** — Hayes Valley, SF. Roast chicken + bread salad is the dish that defined a generation of California cooking.
- **Tartine Bakery** — Mission, SF. Bread + pastries. Line tax is real.
- **State Bird Provisions** — Fillmore, SF. Dim-sum-style California small plates. Reservation-only.

**Mexican**
- **La Taqueria** — Mission, SF. The taco that ended the SF taco debate. Plain rolled, no rice, with crema.
- **El Farolito** — Mission, SF. Late-night burrito institution.

**Mediterranean**
- **Souvla** — multiple, SF. Greek fast-casual rotisserie. Lunchtime go-to.

### Seattle (currently 4 Asian, 0 non-Asian)

**American / PNW**
- **Canlis** — Queen Anne. PNW fine dining, view, sustained excellence. Special-occasion only.
- **The Walrus and the Carpenter** — Ballard. Oysters + small plates, no reservations, beloved by locals.
- **Salumi** — Pioneer Square. Cured meats sandwich shop, originally Mario Batali's father's place. Lunch only.

**Mexican**
- **El Camion** — multiple. Best taco truck in Seattle by consensus.

**Italian**
- **Spinasse** — Capitol Hill. Tajarin pasta is the move. Pre-show date night.

### Boston (currently 3 Asian, 1 fusion, 0 non-Asian-non-Mexican)

**Italian**
- **Neptune Oyster** — North End. Lobster roll + oysters. No reservations, expect 90-min wait, worth it.
- **Galleria Umberto** — North End. Sicilian square slice, cash only, lunch only, sells out by 2pm.
- **Pomodoro** — North End. Tiny BYO pasta. The room is the size of a phone booth.

**American / Brunch**
- **Mamaleh's** — Cambridge. Jewish deli, latkes, bagels. Brunch-only weekends.
- **Toscanini's** — Cambridge. Best ice cream in the city, full stop.

**Mediterranean**
- **Oleana** — Cambridge. Ana Sortun. Levantine-Mediterranean, vegetable-forward, reservation-mandatory.

---

## P0 — Diet coverage (vegan / vegetarian / halal)

Currently only Tasty Noodle House and Curry Up Now are flagged `diet-approved`. That's not enough.

### Vegan / Vegetarian

| City | Restaurant | Why |
|---|---|---|
| NYC | **Superiority Burger** (LES) | Cult vegan burger spot. Brooks Headley. |
| NYC | **Dirt Candy** (LES) | Tasting-menu vegetarian. Amanda Cohen. Reservations. |
| LA | **Crossroads Kitchen** (West Hollywood) | Upscale vegan, Tal Ronnen. |
| LA | **Gracias Madre** (West Hollywood) | Vegan Mexican. Group dinner friendly. |
| Bay | **Greens** (Marina, SF) | OG vegetarian since 1979. View of the Golden Gate. |
| Bay | **Shizen** (Mission, SF) | Vegan sushi. Surprisingly excellent. |
| Seattle | **Plum Bistro** (Capitol Hill) | Vegan-only sit-down. |
| Seattle | **Harvest Beat** (Wallingford) | Plant-based tasting menu, prix fixe. |
| Boston | **True Bistro** (Somerville) | Vegan upscale. Date-night option. |
| Boston | **Veggie Galaxy** (Cambridge) | Vegan diner, all-day breakfast. |

### Halal

| City | Restaurant | Why |
|---|---|---|
| NYC | **The Halal Guys** (Midtown) | Iconic. The yellow rice + white sauce combo. |
| NYC | **Kabab King** (Jackson Heights) | South Asian halal, late-night staple. |
| LA | **Sunnin Lebanese Cafe** (Westwood) | Lebanese halal. |
| Bay | **Zaytoon** (Berkeley) | Lebanese halal, college-area staple. |
| Seattle | **Cedars** (U District) | Lebanese-Indian halal fusion. UW student favorite. |
| Boston | **Kebab Factory** (Somerville) | Indian-Pakistani halal. |

### Gluten-free (notes only)

GF is usually a menu attribute, not a restaurant identity. Better strategy: tag *individual menu items* GF in `whatLocalsOrder` rather than try to source GF-only spots. (Few exist outside dedicated bakeries.)

---

## How many we should actually add

| Tier | Add | Reason |
|---|---|---|
| Bare minimum for App Review | 2 non-Asian + 2 diet per city = **20 new rows** | Reviewer in any city will see balanced cuisine + diet promise honored |
| Beta-ready | 3-4 non-Asian + 2-3 diet per city = **30-35 new rows** | Real foodies in each city will recognize 5+ marquee spots |
| Public launch | 50+ per city total | Enough that 6 weeks of dining doesn't exhaust the catalogue |

Recommendation: do the **bare minimum** before App Store submission, then expand iteratively as scouts onboard.

---

## What I need from you

1. **Strike through anything you don't endorse** — your taste filter is the value
2. **Add anything I missed** — there are spots only you know
3. **Tell me which tier to write** — bare minimum (20) or beta-ready (30-35)
4. When you say "approve," I'll write the TS + SQL rows, with placeholder `insiderTip` you can edit later

Don't approve places you haven't been to. The brand promise dies the moment one fake "insider tip" gets caught.
