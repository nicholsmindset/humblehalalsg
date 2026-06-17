"use client";
import { useEffect, useRef, useState } from "react";

/* Polled after the Mozio payment redirect (?searchId=). Reconciles the booking
   status via /api/travel/transfers/status until confirmed (or a terminal state). */
export default function TransferConfirmationScreen({ searchId }: { searchId: string }) {
  const [status, setStatus] = useState<string>("confirming");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const tries = useRef(0);

  useEffect(() => {
    if (!searchId) { setStatus("failed"); return; }
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      tries.current += 1;
      try {
        const r = await fetch(`/api/travel/transfers/status?searchId=${encodeURIComponent(searchId)}`);
        const d = await r.json();
        if (!active) return;
        if (d.ok) {
          setStatus(d.status);
          if (d.confirmationNumber) setConfirmation(d.confirmationNumber);
          if (d.status === "confirmed" || d.status === "failed" || d.status === "cancelled") return;
        }
      } catch { /* keep polling */ }
      if (active && tries.current < 10) timer = setTimeout(poll, 3000);
    }
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [searchId]);

  return (
    <section className="transfers-screen" style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Your transfer</h1>
      {status === "confirmed" && (
        <p data-testid="transfer-confirmed">Confirmed{confirmation ? ` — reference ${confirmation}` : ""}. We’ve emailed your voucher.</p>
      )}
      {(status === "confirming" || status === "pending") && (
        <p data-testid="transfer-confirming" className="ota-muted">Confirming your transfer… this can take a moment.</p>
      )}
      {(status === "failed" || status === "cancelled") && (
        <p role="alert">We couldn’t confirm this transfer. If you were charged, our team will reach out — please contact support.</p>
      )}
    </section>
  );
}
