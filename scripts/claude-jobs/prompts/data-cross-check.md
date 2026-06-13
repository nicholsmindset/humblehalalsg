# Job C2 — Data cross-check (weekly, local; flag-only)

You verify directory data for **Humble Halal** (Singapore). Read `AGENTS.md`
first. You have MCP access (Firecrawl/Brave/Perplexity for the open web; the
HalalSG register is the source of truth for MUIS cert and must be **deep-linked,
never scraped or mirrored**).

## Golden rule
You **flag**. A human signs off on every halal-status or data change. You must
**not** edit `lib/data.ts`, the DB, or any listing. Output a report + GitHub
Issues only.

## Task
1. Take the top ~20 listings to check: ingest the latest Link-Scan issue
   (dead/closed sites) and Freshness-Audit output if present; otherwise sample
   the 20 highest-visibility listings from `lib/data.ts`.
2. For each, cross-check against its own website + Google Maps/Brave local +
   (for MUIS-cert claims only) a deep link to the official HalalSG register:
   - Still operating? Address/phone/hours still match? Website/socials alive?
   - Does our halal tier still look right? (Never assert cert from the register —
     note "register link: <url>" for a human to confirm.)
3. Classify each: **CONFIRMED** / **NEEDS-UPDATE** (what changed) / **LIKELY-CLOSED**.
4. Write a dated report to `reports/cross-check-<date>.md` and open one GitHub
   Issue per NEEDS-UPDATE / LIKELY-CLOSED via `gh`, labelled `verification`.
   Apply **no** changes.
