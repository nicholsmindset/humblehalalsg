# Seeding the Muslim-friendly overlay

**Why.** Hotel search (classic, Ask-AI, and semantic) overlays our
`muslim_friendly_hotels` table onto LiteAPI results to show prayer-room / halal-food /
alcohol-free flags and a halal score. When the overlay has **no row** for a hotel, every
result falls back to the auto-default (`halalScore: 28`, all flags `false`) — so the halal
differentiation only appears once the overlay is populated. This seeds the top
destinations to make that real.

**Posture (non-negotiable).** The overlay is **human-verified, never AI-generated or
scraped**. The template below ships with factual hotel identity (id/name/city/country
from LiteAPI) but the flag columns are **blank on purpose** — an admin/ustaz fills them
after confirming with the hotel. See [[muis-compliance-posture]]: we surface declared
facilities, never assert MUIS certification.

## The template

[muslim-friendly-overlay-seed.csv](./muslim-friendly-overlay-seed.csv) — 38 real hotels
across Makkah, Madinah, Istanbul, Kuala Lumpur, Singapore (harvested live 2026-06-17;
re-confirm an id still resolves if a row looks stale).

### Columns

| Column | Fill with | Notes |
|---|---|---|
| `liteapi_hotel_id` | *(pre-filled)* | Primary key; matches LiteAPI's hotel id. |
| `hotel_name` | *(pre-filled, reference only)* | Ignored on import — there to help you fill rows. |
| `city`, `country` | *(pre-filled)* | Country is ISO-2. |
| `has_prayer_room` | `TRUE`/`FALSE` | Dedicated prayer room / musholla on-site. |
| `halal_food_onsite` | `TRUE`/`FALSE` | Halal dining at the hotel. |
| `halal_food_nearby` | `TRUE`/`FALSE` | Halal options within walking distance. |
| `alcohol_free` | `TRUE`/`FALSE` | Dry hotel (no alcohol served). |
| `women_only_facilities` | `TRUE`/`FALSE` | Women-only floor/pool/spa etc. |
| `qibla_direction` | `TRUE`/`FALSE` | Qibla marked in rooms. |
| `prayer_mat_available` | `TRUE`/`FALSE` | Prayer mat provided / on request. |
| `near_mosque_m` | integer metres | Distance to nearest mosque (blank = unknown). |
| `source_notes` | free text | How it was verified (e.g. "confirmed w/ hotel 2026-06"). |

`halal_score` is **computed automatically** from the flags (`hotelHalalScore`); leave it to
the system unless you want to override. `verified_by` is set to `ustaz` by the load paths
below — that's what flips on the "Verified Muslim-friendly" badge.

## Loading filled rows — two paths

### 1. Per-hotel (no engineering) — admin console
**Admin → Travel revenue → "Mark a hotel's Muslim-friendly facilities"** (the marking
panel). Paste the `liteapi_hotel_id`, set city/country, tick the flags, save. Verified
write path (confirmed): `POST /api/admin/verify-hotel` → upserts `muslim_friendly_hotels`
with `verified_by='ustaz'` and recomputes `halal_score`
([app/api/admin/verify-hotel/route.ts](../../app/api/admin/verify-hotel/route.ts)). Best
for a handful of hotels.

### 2. Bulk (engineering) — generated seed migration
Fill the whole CSV, then hand it back and we generate a one-time
`supabase/migrations/00NN_overlay_seed.sql` of `INSERT … ON CONFLICT (liteapi_hotel_id)
DO UPDATE` rows with `verified_by='ustaz'`. The data still originates from your
verification — the migration is just the mechanical load. Best for seeding all 38 at once.

## Verify it worked

After loading a few rows, search that city on `/travel` (or call
`/api/travel/search`): the seeded hotels should now show real flags and a `halalScore`
above the 28 default, sorted to the top. Semantic search ("Match my vibe") picks up the
same overlay automatically.
