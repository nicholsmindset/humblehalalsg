"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { Icon } from "../ui";

type ConnectStatus = "loading" | "none" | "restricted" | "pending" | "enabled";

const STATUS_TAG: Record<Exclude<ConnectStatus, "loading">, { label: string; icon: "shield-check" | "info"; bg: string; color: string }> = {
  enabled:    { label: "Connected",    icon: "shield-check", bg: "var(--emerald-200, #cfe8df)", color: "var(--emerald-700, #0D424A)" },
  pending:    { label: "Verifying…",   icon: "info",         bg: "var(--gold-100, #f7ecd0)",     color: "var(--gold-800, #856520)" },
  restricted: { label: "Action needed", icon: "info",        bg: "var(--gold-100, #f7ecd0)",     color: "var(--gold-800, #856520)" },
  none:       { label: "Not set up",   icon: "info",         bg: "var(--cream-200)",             color: "var(--ink-soft)" },
};

export function PayoutsPanel({ toast, flags }: { toast: (m: string) => void; flags: { paidTickets: boolean } }) {
  const [loading, setLoading] = useState(false);
  const [dashLoading, setDashLoading] = useState(false);
  const [status, setStatus] = useState<ConnectStatus>("loading");

  // Reflect the real Connect state (mirrored from Stripe via the account.updated
  // webhook) instead of a hardcoded "Not set up" — an owner who finished
  // onboarding used to still see "Not set up" with a dead dashboard button.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/connect/status");
        const data = await res.json();
        if (alive) setStatus(data?.ok && data.status ? (data.status as ConnectStatus) : "none");
      } catch {
        if (alive) setStatus("none");
      }
    })();
    return () => { alive = false; };
  }, []);

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
        stripe_error: "Payout setup is having a moment — please try again shortly.",
      };
      toast(msg[data.reason] || "Payouts aren’t available yet.");
    } catch {
      toast("Couldn’t start payout setup.");
    } finally {
      setLoading(false);
    }
  };

  // Express dashboard login link — only meaningful once an account exists.
  const openDashboard = async () => {
    setDashLoading(true);
    try {
      const res = await fetch("/api/connect/login", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast(data.reason === "not_onboarded" ? "Finish payout setup first." : "Couldn’t open the Stripe dashboard.");
    } catch {
      toast("Couldn’t open the Stripe dashboard.");
    } finally {
      setDashLoading(false);
    }
  };

  const tag = status === "loading" ? null : STATUS_TAG[status];
  const dashboardReady = status === "enabled" || status === "pending";
  const setupLabel = status === "restricted" || status === "pending" ? "Continue setup" : "Set up payouts";

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
              We use <strong>Stripe Connect</strong>. Buyers pay Humble Halal at checkout, and we transfer your ticket revenue to your Stripe account about <strong>24 hours after your event ends</strong> — we keep only the booking fee (5% + S$0.50 per ticket).
            </p>
          </div>
          <span className="tag" style={{ background: tag ? tag.bg : "var(--cream-200)", color: tag ? tag.color : "var(--ink-soft)" }}>
            <Icon name={tag ? tag.icon : "info"} size={13} /> {tag ? tag.label : "Checking…"}
          </span>
        </div>
        <div className="flex g10 wrap" style={{ marginTop: 16 }}>
          {status !== "enabled" && (
            <button className="btn btn-primary" disabled={loading || status === "loading"} onClick={setup}>
              <Icon name="shield-check" size={17} /> {loading ? "Starting…" : setupLabel}
            </button>
          )}
          <button className="btn btn-outline" disabled={!dashboardReady || dashLoading} aria-disabled={!dashboardReady || dashLoading} onClick={openDashboard}>
            {dashLoading ? "Opening…" : "Stripe dashboard"}
          </button>
          {!dashboardReady && (
            <span className="faint" style={{ fontSize: ".8rem", alignSelf: "center" }}>Dashboard unlocks after onboarding.</span>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>How payouts work</h3>
        <ol className="payout-steps">
          <li><strong>Onboard once</strong> — verify identity + add a bank account (handled by Stripe).</li>
          <li><strong>Sell tickets</strong> — by default buyers pay your ticket price + the booking fee, so you keep the full face value. (If your event absorbs the fee instead, it comes out of your share.)</li>
          <li><strong>Get paid after your event</strong> — we transfer your net revenue to your Stripe account about 24 hours after the event ends; Stripe then pays it to your bank.</li>
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
