import { describe, it, expect } from "vitest";
import { normalizeQuotes, simulatedQuotes } from "../../lib/transfers";
import type { MozioRawResult, TransferSearchInput } from "../../lib/mozio-types";

const input: TransferSearchInput = {
  pickup: "Changi Airport (SIN)", dropoff: "Marina Bay Sands",
  pickupDateTime: "2026-09-01T10:00", passengers: 2, currency: "SGD",
};

describe("normalizeQuotes", () => {
  it("maps raw Mozio results to TransferQuote with safe defaults", () => {
    const raw: MozioRawResult[] = [{
      result_id: "r1", vehicle_type: "Private sedan", provider_name: "Acme Cars",
      max_passengers: 3, total_price: { value: 42.5, currency: "SGD" },
      cancellable: true, cancellation_policy: "Free until 24h", eta_minutes: 35,
    }];
    const [q] = normalizeQuotes("s1", raw);
    expect(q).toMatchObject({
      resultId: "r1", searchId: "s1", vehicleClass: "Private sedan",
      provider: "Acme Cars", seats: 3, price: 42.5, currency: "SGD",
      refundable: true, cancellationTerms: "Free until 24h", etaMinutes: 35,
    });
  });

  it("drops results with no result_id and no price", () => {
    const raw: MozioRawResult[] = [{ vehicle_type: "x" }, { result_id: "r2", total_price: { value: 10, currency: "SGD" } }];
    const out = normalizeQuotes("s1", raw);
    expect(out).toHaveLength(1);
    expect(out[0].resultId).toBe("r2");
  });
});

describe("simulatedQuotes", () => {
  it("returns multiple deterministic quotes for an input", () => {
    const a = simulatedQuotes(input);
    const b = simulatedQuotes(input);
    expect(a.length).toBeGreaterThanOrEqual(2);
    expect(a.map((q) => q.price)).toEqual(b.map((q) => q.price)); // deterministic
    expect(a.every((q) => q.currency === "SGD")).toBe(true);
    expect(a.every((q) => q.seats >= input.passengers)).toBe(true);
  });
});
