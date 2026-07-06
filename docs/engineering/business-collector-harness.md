# Business collector — browser-harness engine (MUIS HalalSG)

How to use [`browser-use/browser-harness`](https://github.com/browser-use/browser-harness)
to read the **MUIS HalalSG certified-business register** into the discovery
pipeline. This is the one source Firecrawl **cannot** do: HalalSG blocks scraping,
so we need a *real, human-like browser* driven interactively on your own machine.

The rest of the pipeline (NEA open data, web search, website/Instagram
enrichment) runs on Firecrawl in the cloud — see the sibling scripts. This doc is
only for the browser-harness half.

---

## Where this runs

**On your Mac, not in CI or a Claude Code web session.** browser-harness is a
Python tool that connects an LLM to a *real Chrome on your machine* over the
Chrome DevTools Protocol (CDP) debugging port. It drives **your** logged-in
browser session, so anything you can see as a human — a JS-rendered register, a
one-time human check — it can read too. That is exactly why it clears what a
headless fetch can't.

## One-time setup

1. **Install browser-harness.** Paste this into Claude Code (or Codex) on your Mac:

   > Install or upgrade browser-harness to the latest stable version with `uv`
   > using Python 3.12, register the skill from `browser-harness skill`, and
   > connect it to my browser.

   No API key is needed for local use. (A free Browser Use Cloud tier exists if
   you ever want cloud browsers, but it isn't required here.)

2. **Enable Chrome remote debugging.** Open `chrome://inspect/#remote-debugging`
   and tick the remote-debugging checkbox, or launch Chrome with
   `--remote-debugging-port=9222`. Authorize the per-attach popup when prompted.

3. **Enable domain skills** (optional, helps on complex sites):
   ```bash
   export BH_DOMAIN_SKILLS=1
   ```

4. **Run from the repo folder** so outputs land in `data/staging/` and the
   downstream scripts pick them up.

## Collect the HalalSG register

1. In Chrome, open the **MUIS HalalSG certified-business directory** and, if it
   asks, sign in / clear any human check yourself (the harness reuses your live
   session).
2. Hand the harness the task prompt in
   [`scripts/collect/halalsg-harness-task.md`](../../scripts/collect/halalsg-harness-task.md).
   It navigates the register, pages through the certified list, and writes the
   results to `data/staging/candidates-halalsg.json` in the **shared candidate
   schema**.
3. Merge into the pipeline:
   ```bash
   node scripts/collect-candidates.mjs --source=halalsg
   node scripts/enrich-candidates.mjs      # fills website/phone/photo from official sites
   node scripts/build-import-csv.mjs        # → data/staging/import-<date>.csv
   ```
4. Upload the CSV in the admin dashboard (**Businesses → Import CSV**), preview,
   commit → it lands in the review queue → approve.

## The shared schema (the seam)

browser-harness must emit the **same JSON shape** Firecrawl produces, so the
rest of the pipeline never knows which engine ran. Candidate objects:

```jsonc
{
  "name":     "Warong Nasi Pariaman",     // required
  "address":  "738 North Bridge Rd, Singapore 198706",
  "postal":   "198706",                   // optional; derived from address if omitted
  "area":     "Kampong Glam",             // optional
  "category": "restaurants",              // free text; server maps it (lib/import-mapping.ts)
  "source":   "halalsg",                  // always "halalsg" for this collector
  "halalHint":"muis-certified (verify on HalalSG)",
  "certNo":   "S-1234-56789",             // MUIS cert number, if shown
  "scheme":   "Eating Establishment",     // MUIS scheme, if shown
  "expiry":   "2026-12-31"                // cert expiry, if shown
}
```

Write either a bare array of these, or `{ "records": [ … ] }` — the collector
reader accepts both.

## The safety boundary (do not cross)

The harness only **reads** HalalSG to build a candidate plus a cert-number
**hint**. It never grants a verified tier and never publishes. Granting MUIS
status on a listing is a **separate, human admin action** in
`app/api/admin/verify` — that stays the single source of truth for halal
verification (repo golden rule: *AI drafts and flags; humans approve*). The
cert numbers land in the companion `import-<date>-verify.csv`, which the admin
uses to drive that Verify step by hand.

## Same tool, harder enrichment cases

The same setup handles any Google-Maps-panel / Instagram enrichment Firecrawl
can't reach (logged-in or heavily JS-rendered). Point the harness at the
business, read the fields, and emit the **enriched** schema (candidate +
`website`, `phone`, `description`, `price_level`, `photo_url`, `attributes[]`,
`verify_note`) into `data/staging/enriched.json`. `build-import-csv.mjs` then
consumes it identically.
