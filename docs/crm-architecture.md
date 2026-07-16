# Humble Halal CRM architecture

## Decision

The CRM uses a hybrid architecture:

- **Supabase is authoritative** for businesses, owners, consent, leads, routing, billing, subscriptions, and reporting facts.
- **Convex is the operational sidecar** for the live pipeline projection, assignments, team tasks, notes, and activity feed.
- **Clerk remains identity** for both Next.js and Convex.

This prevents two databases from independently deciding whether a lead was routed, consented, billed, or won. If Convex is unavailable, public lead intake and the existing Supabase admin/owner flows continue to work.

## Data flow

1. A write commits to `businesses`, `leads`, or `lead_routes` in Supabase.
2. Migration `0071_crm_outbox.sql` writes a purpose-built event to `crm_outbox` in the same transaction.
3. `/api/cron/crm-sync` atomically claims pending events, signs the exact payload with HMAC-SHA256, and posts it to the Convex HTTP Action.
4. Convex verifies the signature and five-minute timestamp window.
5. The internal `crm:ingest` mutation applies the projection transactionally and records the event ID. Duplicate deliveries are harmless; stale out-of-order events are ignored.
6. Successful events are marked processed in Supabase. Failed events unlock with exponential backoff and are retried.

## Privacy and authorization

- Lead name, email, and phone are projected only when `consent_contact = true`.
- A lead without contact consent becomes an anonymous opportunity in Convex.
- The signing secret is server-only and must be identical in Vercel and Convex.
- The Convex dashboard and native task/note mutations require a Clerk identity with the `admin` role, or an exact Clerk user ID in `CRM_ADMIN_USER_IDS`.
- Never add `CRM_SYNC_SECRET` or `CRM_ADMIN_USER_IDS` to a `NEXT_PUBLIC_*` variable.

## Initial setup

1. Create a Convex project in the preferred region and note both URLs:
   - deployment: `https://PROJECT.convex.cloud`
   - HTTP Actions: `https://PROJECT.convex.site`
2. In Clerk, create a JWT template named `convex` using the Convex integration defaults. Include the admin role in the token if Clerk public metadata owns that claim. The secure initial fallback is `CRM_ADMIN_USER_IDS`.
3. Configure the Convex development deployment:

   ```bash
   npx convex dev
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://YOUR-CLERK-ISSUER
   npx convex env set CRM_SYNC_SECRET YOUR-LONG-RANDOM-SECRET
   npx convex env set CRM_ADMIN_USER_IDS user_YOUR_ADMIN_ID
   ```

4. Add these to local/Vercel Next.js environment variables:

   ```text
   NEXT_PUBLIC_CONVEX_URL=https://PROJECT.convex.cloud
   CONVEX_CRM_INGEST_URL=https://PROJECT.convex.site/ingest/supabase
   CRM_SYNC_SECRET=THE-SAME-LONG-RANDOM-SECRET
   ```

5. Apply Supabase migration `0071_crm_outbox.sql`.
6. Deploy Convex with `npm run convex:deploy` and deploy the Next.js application.
7. Open Admin → CRM workspace. Click **Queue snapshot** once, then **Sync now**. The one-minute cron handles ongoing delivery.

## Rollout and rollback

Roll out in this order: schema/functions, environment variables, Supabase migration, Convex deployment, Next.js deployment, snapshot. Verify pending outbox count falls to zero and the live board matches Supabase lead counts.

To pause without data loss, remove `CONVEX_CRM_INGEST_URL` from Next.js or disable the CRM cron; events remain pending in `crm_outbox`. Do not drop the outbox while events are pending. The public site, lead intake, routing, and billing continue from Supabase.

## Ownership boundaries

| Domain | Owner | Write path |
| --- | --- | --- |
| Businesses and owners | Supabase | Existing admin/owner APIs |
| Contact consent and lead PII | Supabase | Public lead API and retention jobs |
| Lead/routing status | Supabase | Existing admin/owner lead APIs |
| Plans, quotas, Stripe state | Supabase | Stripe webhook and billing APIs |
| Pipeline view | Convex projection | Signed outbox ingestion only |
| Team tasks and notes | Convex | Clerk-admin mutations |
| Activity timeline | Convex | Projection ingestion and CRM mutations |
