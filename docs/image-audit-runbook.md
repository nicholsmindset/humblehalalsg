# Business Listing Image Audit & Mass Cleanup — Runbook

Why: seeded listings carried generic Unsplash category stock photos — including two
banned images (glamour model, raw-meat joint) that read as non-halal on a halal-trust
directory. Policy going forward: **a listing shows a real photo or the branded
fallback card — never a stock photo posing as the business** (the seeder no longer
assigns placeholders, and `tests/unit/no-banned-images.test.ts` locks the ban in).

All commands run from the repo root wherever `.env.local` has
`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (enrichment also needs
`FIRECRAWL_API_KEY`, usually in `~/.env`). Every mutating script is **dry-run by
default** — review the output, then re-run with `--apply`.

```bash
npm install                                        # one-time (image-size devDep)

# 1. Baseline audit (read-only) → reports/image-audit.{json,md}
node scripts/audit-images.mjs                      # add --skip-liveness for a fast pass

# 2. Remove the two banned stock photos immediately
node scripts/cleanup-images.mjs strip-known-bad            # review dry-run
node scripts/cleanup-images.mjs strip-known-bad --apply

# 3. Enrich real photos (Firecrawl → re-hosted to the business-photos bucket).
#    Resumable via scripts/.enrich-progress.json — re-run until done.
node scripts/enrich-images.mjs 25 --dry            # sanity-check candidate quality
node scripts/enrich-images.mjs 100                 # real batches

# 4. Strip whatever is still on a placeholder → branded fallback card
node scripts/cleanup-images.mjs strip-placeholders         # refuses if enrichment
node scripts/cleanup-images.mjs strip-placeholders --apply # hasn't been attempted

# 5. Reconcile the governed photos table (roles, alt text, dims, hashes, orphans)
node scripts/cleanup-images.mjs sync-governance
node scripts/cleanup-images.mjs sync-governance --apply

# 6. Purge ISR caches for every touched listing
SITE_URL=https://www.humblehalal.com CRON_SECRET=... \
  node scripts/cleanup-images.mjs revalidate --apply

# 7. Re-audit — expect: known-bad 0, unsplash-placeholder 0, governance drift 0
node scripts/audit-images.mjs
```

Then apply migration `0076_review_helpful_rpc.sql` (Supabase dashboard or CLI) so
review "Helpful" votes persist.

After cleanup:
- Enriched covers appear in **Admin → Media → Quality** with `rights_confirmed=false`
  — do a human pass to confirm each photo actually shows the right business.
- The audit report's "Hardcoded stock imagery" table lists editorial surfaces
  (area heroes, blog, events, travel). Stock is acceptable there; fill in the
  verdict column and swap any image that reads as non-halal.
- `reports/cleanup-log.json` is the append-only action log of every `--apply` run.
