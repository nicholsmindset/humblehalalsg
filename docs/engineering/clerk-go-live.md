# Clerk auth — go-live runbook

Migration from Supabase Auth → **Clerk** (Supabase stays the database). Branch
`feat/clerk-auth` / PR #76. The code is inert until the steps below are done.
**Verify on a preview before merging to master.**

## 0. Prerequisites
- A Clerk application (start with the **Development** instance for testing).
- The single Supabase project (prod). Tables holding user identity are empty
  (clean cutover) — confirm before running the migration.

## 1. Clerk dashboard
1. Enable sign-in methods: **Email verification code** + **Google** (OAuth).
2. (Optional, "all features") enable **MFA** and **bot/abuse protection** — no
   code needed; `<UserButton/>` exposes MFA enrollment under Security.
3. **Webhooks** → add endpoint:
   - Dev/preview: `https://<preview-url>/api/webhooks/clerk`
   - Prod: `https://www.humblehalal.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`. Copy the signing secret.
4. Copy the **Publishable key** + **Secret key** and the **Frontend API / issuer**
   domain (needed for Supabase below).

## 2. Supabase dashboard
**Authentication → Third-Party Auth → add Clerk.** Paste the Clerk issuer /
Frontend-API domain. Without this, Supabase rejects every Clerk JWT (PostgREST
401) and all owner/admin queries return empty.

## 3. Environment variables (preview first, then prod)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```
Keep the existing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
`SUPABASE_SERVICE_ROLE_KEY`.

## 4. Database migration
Run `supabase/migrations/0031_clerk_auth.sql`. It is transactional (a failure
rolls back fully) and idempotent. It retypes user ids uuid→text and rewrites
RLS/functions to `auth.jwt()->>'sub'`.
- ⚠️ If the run prints `NOTICE: function X still uses auth.uid()`, rewrite that
  function to `(auth.jwt()->>'sub')` — it's a DB object not in this branch's files.
- ⚠️ Confirm user-identity tables are empty first (clean cutover assumption).

## 5. First admin
Sign up via the app, then in SQL:
```sql
update profiles set role = 'admin' where id = 'user_xxxxx';  -- the Clerk id
```

## 6. Smoke test (do all before merge)
1. **Email-code sign-up** → enter code → signed in. Confirm a `profiles` row was
   created (`id` = `user_...`, `role` = `user`).
2. **Google sign-in** → redirects via `/sign-in/sso-callback` → home, signed in.
3. **Header** → `<UserButton/>` shows; "My dashboard" action navigates; sign out
   returns to `/` and the app flips to Guest.
4. **Protected route** while signed out: `/owner`, POST `/api/follow` → redirect/401.
5. **Admin gate**: non-admin → `/admin` & `/api/admin/queue` = 403; admin = 200.
6. **RLS isolation**: user A creates a follow; A sees it, user B does not (proves
   the Clerk token drives RLS, not the service role).
7. **Regression**: a cron route (`/api/cron/refresh-stats` + `CRON_SECRET`) and the
   Stripe webhook still 200 (they're excluded from Clerk protection).

## 7. Merge & promote
After the smoke test passes on preview: merge PR #76 to `master`, then promote to
prod **only from merged master** (per the prod-deploy coordination rule), with the
prod Clerk keys + webhook + Supabase Third-Party Auth configured.

## Rollback
Revert the merge commit and redeploy. The DB schema change (0031) is the only
non-trivial revert; since it's a clean cutover with no user data, restoring the
prior uuid columns/policies would require a reverse migration — keep a snapshot
before running 0031 if you want a fast DB rollback.
