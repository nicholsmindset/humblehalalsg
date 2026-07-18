import { describe, it, expect, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reverseOrderTransferIfPaid, setPayoutStatus } from "@/lib/payout-reversal";

/* Separate-charges Connect model: a refund/dispute debits OUR balance, never the
   organiser's — so we must claw back the transfer we already sent (lib/payout-
   reversal). This must be idempotent per order and degrade its DB status safely.
   A bug here means the organiser keeps money we refunded to the buyer. */

/** Records every orders-update patch the code writes. */
function fakeDb(opts: { updateError?: boolean } = {}) {
  const patches: Record<string, unknown>[] = [];
  const db = {
    patches,
    from() {
      return {
        update(patch: Record<string, unknown>) {
          return {
            eq(_col: string, _val: unknown) {
              patches.push(patch);
              return Promise.resolve({ error: opts.updateError ? { message: "boom" } : null });
            },
          };
        },
      };
    },
  };
  return db as unknown as SupabaseClient & { patches: Record<string, unknown>[] };
}

function fakeStripe(opts: { throwOnReversal?: boolean } = {}) {
  const createReversal = vi.fn((_id: string, _params: unknown, _extra: unknown) =>
    opts.throwOnReversal ? Promise.reject(new Error("insufficient balance")) : Promise.resolve({ id: "trr_1" }),
  );
  return { stripe: { transfers: { createReversal } } as unknown as Stripe, createReversal };
}

describe("setPayoutStatus", () => {
  it("writes the requested status", async () => {
    const db = fakeDb();
    await setPayoutStatus(db, "order_1", "reversed");
    expect(db.patches).toEqual([{ payout_status: "reversed" }]);
  });

  it("degrades to 'skipped' when the update errors (pre-migration constraint)", async () => {
    const db = fakeDb({ updateError: true });
    await setPayoutStatus(db, "order_1", "reversed");
    // First write rejected by the check-constraint → retried as the always-valid 'skipped'.
    expect(db.patches).toEqual([{ payout_status: "reversed" }, { payout_status: "skipped" }]);
  });
});

describe("reverseOrderTransferIfPaid", () => {
  it("does nothing when the payout never ran", async () => {
    const db = fakeDb();
    const { stripe, createReversal } = fakeStripe();
    const r = await reverseOrderTransferIfPaid(stripe, db, {
      id: "order_1", payout_status: "pending", stripe_transfer_id: "tr_1",
    });
    expect(r).toBe("not_needed");
    expect(createReversal).not.toHaveBeenCalled();
    expect(db.patches).toEqual([]);
  });

  it("does nothing when there is no transfer to reverse", async () => {
    const db = fakeDb();
    const { stripe, createReversal } = fakeStripe();
    const r = await reverseOrderTransferIfPaid(stripe, db, {
      id: "order_1", payout_status: "paid", stripe_transfer_id: null,
    });
    expect(r).toBe("not_needed");
    expect(createReversal).not.toHaveBeenCalled();
  });

  it("reverses a paid transfer with a per-order idempotency key and marks it reversed", async () => {
    const db = fakeDb();
    const { stripe, createReversal } = fakeStripe();
    const r = await reverseOrderTransferIfPaid(stripe, db, {
      id: 42, payout_status: "paid", stripe_transfer_id: "tr_9",
    });
    expect(r).toBe("reversed");
    expect(createReversal).toHaveBeenCalledWith("tr_9", {}, { idempotencyKey: "reverse_order_42" });
    expect(db.patches).toEqual([{ payout_status: "reversed" }]);
  });

  it("flags 'reverse_failed' when Stripe rejects (e.g. organiser balance too low)", async () => {
    const db = fakeDb();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { stripe } = fakeStripe({ throwOnReversal: true });
    const r = await reverseOrderTransferIfPaid(stripe, db, {
      id: "order_7", payout_status: "paid", stripe_transfer_id: "tr_7",
    });
    expect(r).toBe("failed");
    expect(db.patches).toEqual([{ payout_status: "reverse_failed" }]);
    errSpy.mockRestore();
  });
});
