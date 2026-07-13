# Data erasure runbook (GDPR / PDPA right-to-be-forgotten)

Erasure is implemented in `lib/erasure.ts` (`eraseUserData`) and runs from two
places:

1. **Automatically** when a Clerk user is deleted → `app/api/webhooks/clerk`
   (`user.deleted`).
2. **On request** by an admin → `POST /api/admin/users/erase` `{ userId, email? }`
   (also deletes the Clerk account).

Requires migrations **0069** (audit_log append-only) and **0070** (redacted_at
columns + notifications FK) applied.

## What happens to each data class

| Data | Action | Why |
|---|---|---|
| `profiles` row | **Delete** | Identity |
| `reviews` (authored) | **Delete** | User-generated content — erasure = removal |
| `notifications` | **Delete** | Personal, no retention need (0070 also adds a cascade FK) |
| `follows`, `passport_points`, `event_rsvps`, referrals | **Delete** (FK cascade) | Personal activity |
| `orders` | **Anonymise** (`buyer_email=null`, `buyer_name='Redacted'`, `redacted_at`) | Financial record — retain ~5 yrs (SG IRAS) with PII stripped |
| `hotel_bookings` | **Anonymise** (`guest_email=null`, `redacted_at`) | Same — financial/booking record |
| `leads` (by email) | **Anonymise** (`name='Redacted'`, `email/phone=null`) | Consumer PII in quote requests |

Each step is isolated (one failure won't abort the rest); the profile is deleted
**last** so it remains the join key for anonymisation. The routine is idempotent.
Every run writes an `user.erased` row to the (now append-only) `audit_log` with a
per-step count summary.

## Verify
1. Seed a test user with a review, a free order, a notification.
2. Delete them in the Clerk dashboard (or `POST /api/admin/users/erase`).
3. Check: profile gone, notifications gone, review gone; the order row still
   exists with `buyer_email = null` and `redacted_at` set; `audit_log` has a
   `user.erased` entry.
4. `update audit_log set action='x' where …` in the SQL editor → raises
   `audit_log is append-only`.

## Notes
- Financial-record retention is a deliberate legal choice — do **not** switch
  orders/bookings to hard-delete without accounting sign-off.
- If a future data class stores PII keyed to the user, add a step to
  `eraseUserData` (delete or anonymise per the table above).
