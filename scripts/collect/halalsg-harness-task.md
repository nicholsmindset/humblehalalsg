# browser-harness task — collect the MUIS HalalSG register

Hand this whole prompt to browser-harness (running against your logged-in Chrome
on your Mac). Setup: `docs/engineering/business-collector-harness.md`.

---

## Task

You are driving a real Chrome browser via CDP. Collect certified businesses from
the **MUIS HalalSG certified-business directory** (the official Singapore halal
certification register — the same data behind the HalalSG app). Work like a
careful human: open the directory, use its own search/filter/pagination, and read
what's on screen. **Do not** use any scraping shortcut, hidden API, or bulk
export — page through the results the way a visitor would, at a gentle pace.

For each certified business listed, read whatever of these fields the page shows:

- `name` — business/premises name (**required**; skip an entry if there's no name)
- `address` — full address
- `postal` — 6-digit Singapore postal code (from the address if not separate)
- `area` — locality/neighbourhood, if shown
- `category` — the MUIS scheme category (e.g. Eating Establishment, Food
  Preparation Area, Endorsed Product); map loosely to a plain word like
  `restaurants`, `cafes`, or `groceries` when obvious, else leave blank
- `certNo` — the MUIS certificate number
- `scheme` — the MUIS certification scheme name
- `expiry` — certificate expiry date (ISO `YYYY-MM-DD` if you can normalise it)

Always set `halalHint` to `"muis-certified (verify on HalalSG)"` and
`source` to `"halalsg"`.

## Scope

**Run one focused batch at a time — do NOT try to collect the whole register in
one go.** The register has thousands of entries; a small batch takes ~10–30 min,
is easy to watch, and gives you a reviewable chunk in the admin queue instead of
a giant dump. Pick a scope, run it, then come back for the next one.

Set the scope by editing the line below before you hand this prompt over — pick
ONE:

> **Scope for this run:** `<paste one of the examples below>`

Ready-to-paste examples:

- **By area** — `Only businesses in the Tampines area (use the directory's area/region filter).`
- **By category/scheme** — `Only the "Eating Establishment" scheme.` (or "Food Preparation Area", "Endorsed Product", "Snack Bar", etc.)
- **By page range** — `Pages 1 to 5 of the certified list, default sort.`
- **By search term** — `Search the register for "cafe" and collect the matches.`
- **Combined** — `"Eating Establishment" scheme in the Woodlands area, first 40 results.`

Rules for every run:

- Cover exactly the scope above — nothing more.
- If you hit the end of the scope, say so. If you **cap** the run (e.g. time or a
  page limit), **state how many pages/entries you covered and how many remain**,
  and what scope to use next to continue — never imply you got everything.
- De-duplicate obvious repeats by name+postal within your run.
- The pipeline is resumable: each batch appends to the same downstream files
  (`collect-candidates.mjs --source=halalsg` merges + dedupes against what's
  already collected, live, or in the review queue), so overlapping batches are
  safe — duplicates get dropped, not doubled.

## Output

Write a JSON file to `data/staging/candidates-halalsg.json` (relative to the repo
root). Use this exact shape — a `records` array of objects:

```json
{
  "generated_at": "2026-07-06T00:00:00.000Z",
  "source": "MUIS HalalSG certified-business register",
  "count": 2,
  "records": [
    {
      "name": "Warong Nasi Pariaman",
      "address": "738 North Bridge Rd, Singapore 198706",
      "postal": "198706",
      "area": "Kampong Glam",
      "category": "restaurants",
      "source": "halalsg",
      "halalHint": "muis-certified (verify on HalalSG)",
      "certNo": "S-1234-56789",
      "scheme": "Eating Establishment",
      "expiry": "2026-12-31"
    },
    {
      "name": "Example Halal Bakery",
      "address": "1 Example Rd, Singapore 123456",
      "postal": "123456",
      "source": "halalsg",
      "halalHint": "muis-certified (verify on HalalSG)",
      "certNo": "S-9876-54321",
      "scheme": "Food Preparation Area"
    }
  ]
}
```

Omit any field you couldn't read (don't invent values). Leaving `certNo`/`expiry`
blank is fine — the admin still verifies each one by hand.

## Boundary

You are only **reading** the register to build candidates + cert-number hints.
Do not log into, submit, or change anything. Publishing and granting MUIS status
happen elsewhere, by a human admin.

## After you finish

Tell the operator to run, from the repo root:

```bash
node scripts/collect-candidates.mjs --source=halalsg
node scripts/enrich-candidates.mjs
node scripts/build-import-csv.mjs
```
