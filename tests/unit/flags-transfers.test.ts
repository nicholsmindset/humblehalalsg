import { describe, it, expect, afterEach } from "vitest";
import { getServerFlags, DEFAULT_FLAGS } from "../../lib/flags";

describe("paidTransfers flag", () => {
  afterEach(() => { delete process.env.PAID_TRANSFERS_ENABLED; });

  it("defaults OFF", () => {
    expect(DEFAULT_FLAGS.paidTransfers).toBe(false);
    expect(getServerFlags().paidTransfers).toBe(false);
  });

  it("reads PAID_TRANSFERS_ENABLED=1 as ON", () => {
    process.env.PAID_TRANSFERS_ENABLED = "1";
    expect(getServerFlags().paidTransfers).toBe(true);
  });
});
