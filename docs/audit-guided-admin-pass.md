# Guided admin pass — post-audit verification (human, ~20 min)

The negative-path suite (`node scripts/audit-negative-paths.mjs`) covers everything
reachable anonymously. These checks need an **admin Clerk session** (Clerk refuses
localhost, so do them on `https://www.humblehalal.com` signed in as an admin). Tick
each; anything that fails is a regression.

## Prereqs (do these first)
- [ ] Paste `supabase/migrations/0060_tiktok_submissions_close_leak.sql` (Supabase SQL editor). Then confirm the negative-path suite still passes.
- [ ] `gh secret set CRON_SECRET` (value = Vercel prod `CRON_SECRET`), then `gh workflow run flight-retry.yml` → the run should go green.

## 1. Feature-flag tri-state (audit R6, PR #202)
- [ ] Admin → **Monetization**. Each flag row shows a **source line** — "following env (on/off)" or "admin override on/off — env says X".
- [ ] Pick a flag that shows an admin override and click **Reset to env** → the row switches to "following env (…)" and the toggle reflects the env value.
- [ ] The switch reflects the **resolved** state (override ?? env), not just the DB value.

## 2. Service-role key + TikTok flag (audit R2 — the definitive test)
- [ ] In Monetization, turn **TikTok features ON**. It should save with a success toast (NOT "couldn't save / not persisted").
- [ ] Reload the page → the toggle stays ON (persisted). ✅ = the prod `SUPABASE_SERVICE_ROLE_KEY` is a real service-role key. ❌ (reverts / error) = it's the anon key — fix: paste the real `service_role` secret into Vercel env + redeploy (see [[flag-toggle-write-bug]]).
- [ ] With it ON, the homepage shows "Fresh from the community" + the Eminami video, and `/business/eminami-downtown-east` shows the video.

## 3. Per-business flag consistency (audit R5, PR #201)
- [ ] Admin → Businesses → pick a test business → Features panel → set **Sponsored ads = On** (per-business override).
- [ ] As that business's owner (or via the owner dashboard), the ads builder should now offer paid checkout consistently with what the checkout route enforces — the shown state matches enforcement (no "enabled in UI, refused at checkout").

## 4. Cert vault — expired cert guard (audit certVault-01, PR #208)
- [ ] Admin → Halal verification. If any pending cert has an `expires_on` in the past, **Approve** must fail with "Certificate expired…" (409), not grant a badge. (Reject still works.)

## 5. Review points on approval (review-hardening, PR #210)
- [ ] Submit a review as a signed-in user → your passport total does **not** increase yet (still pending).
- [ ] Admin → moderation queue → **approve** that review → the reviewer's passport gains +50 (and any pending referral qualifies). Re-approving does not double-award.

## 6. Verdicts (post-#146 + 0052) — only if you have a draft
- [ ] Admin → Halal verdicts → draft a verdict → approve. The public `/is-halal/<slug>` page updates atomically (no 404 window). A "halal" verdict without a cited source is blocked (409 compliance_blocked).

## 7. Passport clarity (Phase C, PR #209)
- [ ] Owner dashboard → Overview shows the **"Halal Passport — collect visits"** card linking to the QR poster.
- [ ] `/faq` → the Halal Passport entry now explains both the diner earning values and the business QR/stamp mechanic.
