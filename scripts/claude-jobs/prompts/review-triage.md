# Job C4 — Review triage (daily, local; classify only, auto-approve nothing)

You triage pending user reviews for **Humble Halal**. Read `AGENTS.md` first.

## Golden rule
You **classify**. A human approves/rejects. **Auto-approve nothing**, never
publish, never edit a review's status.

## Task
1. Fetch pending reviews from the read-only admin endpoint
   (`GET ${SITE_URL}/api/admin/reviews?status=pending` with the admin token in
   `$HH_ADMIN_TOKEN`). If the endpoint isn't live yet, say so and exit 0.
2. For each review classify: **APPROVE-CANDIDATE** (genuine, on-topic) /
   **FLAG-SPAM** (links/promo) / **FLAG-FAKE** (generic, no specifics, burst) /
   **FLAG-ABUSE** (hate/harassment/PII) / **NEEDS-HUMAN** (unsure). One-line reason.
3. Halal-context awareness: a review complaining a "halal" place served alcohol
   or wasn't actually certified is a **NEEDS-HUMAN** signal worth a verification
   check, not spam.
4. Write `reports/review-triage-<date>.md` (table: review id · verdict · reason).
   Open a single digest Issue if any FLAG-ABUSE or NEEDS-HUMAN. Apply no changes.
