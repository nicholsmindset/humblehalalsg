"use client";

/* Organiser view of "request to join" submissions for an approval-gated event.
   Approve issues the attendee's ticket + QR (and emails them); decline cancels
   the request. Access is enforced by /api/events/[id]/requests (organiser or
   admin), not by this screen. */
import { useCallback, useEffect, useState } from "react";
import { useApp } from "../app-context";
import { Empty, Icon, MobileHeader } from "../ui";

type JoinReq = { id: string; name: string; email: string; qty: number; at: string };

export function EventRequestsScreen({ slug }: { slug: string }) {
  const { navigate, toast } = useApp();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");
  const [reqs, setReqs] = useState<JoinReq[]>([]);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`/api/events/${encodeURIComponent(slug)}/requests`);
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setErr(
          j?.reason === "forbidden" ? "You’re not the organiser of this event."
          : j?.reason === "unauthenticated" ? "Please sign in as the organiser."
          : "Couldn’t load requests.",
        );
        setReqs([]);
      } else {
        setTitle(String(j.event || ""));
        setReqs(Array.isArray(j.requests) ? (j.requests as JoinReq[]) : []);
      }
    } catch { setErr("Couldn’t load requests."); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: "approve" | "decline") => {
    setBusy(id);
    try {
      const r = await fetch(`/api/events/${encodeURIComponent(slug)}/requests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, action }),
      });
      const j = await r.json().catch(() => null);
      if (j?.ok) {
        setReqs((rs) => rs.filter((x) => x.id !== id));
        toast?.(action === "approve" ? "Approved — ticket issued ✓" : "Request declined");
      } else toast?.("Couldn’t update — please try again");
    } catch { toast?.("Couldn’t update — please try again"); }
    finally { setBusy(""); }
  };

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Join requests" onBack={() => navigate("owner-dashboard")} />
      <div className="hh-wrap" style={{ maxWidth: 640, paddingTop: 14, paddingBottom: 40 }}>
        {title && <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.4rem", marginBottom: 4 }}>{title}</h1>}
        <p className="muted" style={{ marginBottom: 18 }}>Approve or decline people who asked to join. Approving issues their ticket + QR and emails them.</p>
        {loading ? (
          <p className="muted" style={{ textAlign: "center", padding: "32px 0" }}>Loading requests…</p>
        ) : err ? (
          <Empty icon="shield" title="Can’t show requests" body={err} action="Back to dashboard" onAction={() => navigate("owner-dashboard")} />
        ) : reqs.length === 0 ? (
          <Empty icon="users" title="No pending requests" body="When someone requests to join this event, they’ll appear here for you to approve." action="Back to dashboard" onAction={() => navigate("owner-dashboard")} />
        ) : (
          <div className="stack g12">
            {reqs.map((q) => (
              <div key={q.id} className="card" style={{ padding: 14 }}>
                <div className="flex between center wrap" style={{ gap: 12 }}>
                  <div className="f1" style={{ minWidth: 160 }}>
                    <div style={{ fontWeight: 700 }}>{q.name}{q.qty > 1 ? ` · ${q.qty} guests` : ""}</div>
                    {q.email && <div className="evt-meta"><Icon name="mail" size={13} /> {q.email}</div>}
                    <div className="faint" style={{ fontSize: ".78rem", marginTop: 2 }}>Requested {q.at ? new Date(q.at).toLocaleDateString("en-SG", { day: "numeric", month: "short" }) : ""}</div>
                  </div>
                  <div className="flex g8">
                    <button className="btn btn-primary btn-sm" disabled={busy === q.id} onClick={() => act(q.id, "approve")}><Icon name="check" size={15} /> Approve</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} disabled={busy === q.id} onClick={() => act(q.id, "decline")}><Icon name="x" size={15} /> Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
