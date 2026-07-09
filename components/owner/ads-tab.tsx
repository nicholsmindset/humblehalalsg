"use client";

/* Owner "Sponsored ads" tab — self-serve campaigns end-to-end:
   campaign cards with an honest lifecycle chip (Awaiting payment / Pending
   review / Scheduled / Live / Ended / Rejected / Paused) + real reach numbers
   from the owner_campaign_performance RPC (0024, extended by 0044), and the
   CampaignBuilder to book a new one. Deep-linkable: /owner?tab=ads&new=1
   (&placement=key) opens the builder preselected. */

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { useApp } from "../app-context";
import { Icon, ImagePh } from "../ui";
import { CampaignBuilder } from "./campaign-builder";
import type { OwnerBiz } from "./types";

type OwnerCampaign = {
  campaign_id: string; title: string; placement_key: string; status: string;
  review_status?: string | null; created_via?: string | null;
  body?: string | null; image_url?: string | null; target_url?: string | null;
  rate_cents: number; starts_on: string | null; ends_on: string | null; impressions: number; clicks: number;
};

const todaySG = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

/** One chip that tells the owner where the campaign actually is. */
function lifecycle(c: OwnerCampaign): [string, string] {
  if (c.review_status === "rejected") return ["Rejected", "red"];
  if (c.status === "draft") return c.created_via === "self_serve" ? ["Awaiting payment", "amber"] : ["Draft", "amber"];
  if (c.status === "paused") return ["Paused", "amber"];
  if (c.status === "ended" || (c.ends_on && c.ends_on < todaySG())) return ["Ended", ""];
  if (c.review_status === "pending") return ["Pending review", "amber"];
  if (c.starts_on && c.starts_on > todaySG()) return [`Starts ${c.starts_on}`, "amber"];
  return ["Live", "green"];
}

export function OwnerAds({ navigate, biz }: { navigate: ReturnType<typeof useApp>["navigate"]; biz: OwnerBiz | null }) {
  const { params, toast } = useApp();
  const supabase = useSupabaseBrowser();
  const { isLoaded, isSignedIn } = useUser();
  const [rows, setRows] = useState<OwnerCampaign[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);
  const [building, setBuilding] = useState(false);

  const load = useCallback(async () => {
    if (!isLoaded) return;
    const sb = supabase;
    if (!sb || !isSignedIn) {
      setRows(null);
      setLoadErr(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadErr(false);
    const { data, error } = await sb.rpc("owner_campaign_performance");
    if (!error && Array.isArray(data)) setRows(data as OwnerCampaign[]);
    else if (error) setLoadErr(true); // was silently swallowed → looked like "no campaigns"
    setLoading(false);
  }, [supabase, isLoaded, isSignedIn]);

  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await load(); })();
    return () => { alive = false; };
  }, [load]);

  // Deep links: ?new=1 opens the builder; ?purchase=done confirms a payment.
  useEffect(() => {
    if (params.new === "1" && biz) setBuilding(true);
    if (params.purchase === "done") toast("Payment received — your campaign is queued for review");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.new, params.purchase, biz?.id]);

  if (loading) return <div className="dash-pane"><div className="card" style={{ padding: 28, height: 120, opacity: 0.5 }} aria-busy="true" /></div>;
  if (loadErr) return <div className="dash-pane"><div className="card" style={{ padding: 20 }}><p className="faint" role="alert">Couldn&apos;t load your campaigns — refresh to try again.</p></div></div>;

  if (building && biz) {
    return (
      <div className="dash-pane">
        <CampaignBuilder
          businessId={biz.id}
          businessName={biz.name}
          initialPlacement={typeof params.placement === "string" ? params.placement : undefined}
          toast={toast}
          onClose={() => setBuilding(false)}
          onSubmitted={() => { setBuilding(false); void load(); }}
        />
      </div>
    );
  }

  const money = (c: number) => `S$${Math.round(c / 100).toLocaleString()}`;

  if (!rows || rows.length === 0) {
    return (
      <div className="dash-pane">
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--cream-200)", margin: "0 auto 12px" }}><Icon name="trophy" size={24} /></div>
          <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>Promote your business</h3>
          <p className="faint" style={{ fontSize: ".9rem", maxWidth: 440, margin: "0 auto" }}>Featured placement, homepage spotlight and category sponsorships put you in front of more of Singapore’s Muslim community — book a campaign in a couple of minutes, right here.</p>
          <div className="flex g8 center" style={{ justifyContent: "center", marginTop: 14 }}>
            {biz ? (
              <button className="btn btn-gold btn-sm" onClick={() => setBuilding(true)}><Icon name="plus" size={14} /> Start a campaign</button>
            ) : (
              <button className="btn btn-gold btn-sm" onClick={() => navigate("add-listing")}>Add your business first</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("advertise")}>See ad options</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-pane stack g12">
      <div className="flex between center wrap g10">
        <h3 style={{ fontSize: "1.15rem" }}>Your campaigns</h3>
        {biz && (
          <button className="btn btn-gold btn-sm" onClick={() => setBuilding(true)}><Icon name="plus" size={14} /> New campaign</button>
        )}
      </div>
      {rows.map((r) => {
        const [label, tone] = lifecycle(r);
        const ctr = r.impressions > 0 ? Math.round((r.clicks / r.impressions) * 1000) / 10 : 0;
        return (
          <div key={r.campaign_id} className="card" style={{ display: "flex", gap: 14, padding: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 84, height: 60, borderRadius: 8, overflow: "hidden", flex: "none" }}>
              <ImagePh label={r.title} tone="gold" src={r.image_url || undefined} style={{ width: "100%", height: "100%" }} />
            </div>
            <div className="f1" style={{ minWidth: 170 }}>
              <div className="flex g8 center wrap">
                <span className={`pill-tag ${tone}`}>{label}</span>
                <span style={{ fontWeight: 700 }}>{r.title}</span>
              </div>
              <div className="faint" style={{ fontSize: ".8rem", marginTop: 3 }}>
                {r.placement_key}{r.starts_on ? ` · ${r.starts_on} → ${r.ends_on || "—"}` : ""} · {money(r.rate_cents)}
              </div>
              {r.review_status === "rejected" && (
                <p className="faint" style={{ fontSize: ".8rem", marginTop: 3, color: "var(--danger)" }}>
                  The creative didn&rsquo;t pass our halal brand-safety review — we&rsquo;ll email you to fix or refund it.
                </p>
              )}
            </div>
            <div className="evt-mini-stats">
              <div><div className="ems-v">{r.impressions.toLocaleString()}</div><div className="ems-l">views</div></div>
              <div><div className="ems-v">{r.clicks.toLocaleString()}</div><div className="ems-l">clicks</div></div>
              <div><div className="ems-v">{ctr}%</div><div className="ems-l">CTR</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
