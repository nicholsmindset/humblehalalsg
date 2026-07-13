"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { Icon } from "../ui";

export function PayoutsPanel({ toast, flags }: { toast: (m: string) => void; flags: { paidTickets: boolean } }) {
  const [loading, setLoading] = useState(false);
  // Without Stripe + Supabase wired, onboarding isn't possible yet.
  const setup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        track.ownerAction("connect_onboard");
        window.location.href = data.url;
        return;
      }
      const msg: Record<string, string> = {
        stripe_not_configured: "Payouts go live once Stripe is connected.",
        db_not_configured: "Connect Supabase + Stripe to enable payouts.",
        unauthenticated: "Log in as the business owner first.",
        no_business: "Claim or add your business first.",
      };
      toast(msg[data.reason] || "Payouts aren’t available yet.");
    } catch {
      toast("Couldn’t start payout setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-pane stack g16">
      {!flags.paidTickets && (
        <div className="notice notice-warn">
          <Icon name="info" size={18} />
          <span>Paid tickets are currently <strong>off</strong> platform-wide. You can set up payouts now so you’re ready the moment paid ticketing is enabled.</span>
        </div>
      )}

      <div className="card" style={{ padding: 22 }}>
        <div className="flex between center wrap g12">
          <div>
            <span className="eyebrow">Payouts</span>
            <h3 style={{ fontSize: "1.4rem", marginTop: 6 }}>Get paid for ticket sales</h3>
            <p className="faint" style={{ maxWidth: 460, marginTop: 4 }}>
              We use <strong>Stripe Connect</strong>. When a ticket sells, your full ticket price lands in your Stripe balance and Stripe pays it out to your bank automatically — Humble Halal only takes the booking fee.
            </p>
          </div>
          <span className="tag" style={{ background: "var(--cream-200)", color: "var(--ink-soft)" }}>
            <Icon name="info" size={13} /> Not set up
          </span>
        </div>
        <div className="flex g10 wrap" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" disabled={loading} onClick={setup}>
            <Icon name="shield-check" size={17} /> {loading ? "Starting…" : "Set up payouts"}
          </button>
          <button className="btn btn-outline" disabled aria-disabled="true">
            Stripe dashboard
          </button>
          <span className="faint" style={{ fontSize: ".8rem", alignSelf: "center" }}>Dashboard unlocks after onboarding.</span>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>How payouts work</h3>
        <ol className="payout-steps">
          <li><strong>Onboard once</strong> — verify identity + add a bank account (handled by Stripe).</li>
          <li><strong>Sell tickets</strong> — buyers pay face value + a booking fee; you keep the full face value.</li>
          <li><strong>Get paid automatically</strong> — Stripe transfers your balance to your bank on a rolling schedule.</li>
        </ol>
      </div>

      {/* No fake stat grid: gross/paid-out/pending were hardcoded zeros (and the
          footer quoted MOCK analytics) presented as live numbers. Real figures
          render here once ticket sales are wired to the DB. */}
      <p className="faint" style={{ fontSize: ".82rem" }}>
        Sales, payout and ticket numbers will appear here once paid ticketing is live.
      </p>
    </div>
  );
}
