"use client";

/* Advertiser report — the owner's own sponsored campaigns + real reach, via the
   owner_campaign_performance RPC (0024, scoped to the Clerk subject). Empty-state
   pitches the ad products when there's nothing live. */

import { useEffect, useState } from "react";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { useApp } from "../app-context";
import { Icon } from "../ui";

type OwnerCampaign = {
  campaign_id: string; title: string; placement_key: string; status: string;
  rate_cents: number; starts_on: string | null; ends_on: string | null; impressions: number; clicks: number;
};

export function OwnerAds({ navigate }: { navigate: ReturnType<typeof useApp>["navigate"] }) {
  const supabase = useSupabaseBrowser();
  const [rows, setRows] = useState<OwnerCampaign[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) { if (alive) setLoading(false); return; }
      const { data, error } = await sb.rpc("owner_campaign_performance");
      if (alive) {
        if (!error && Array.isArray(data)) setRows(data as OwnerCampaign[]);
        else if (error) setLoadErr(true); // was silently swallowed → looked like "no campaigns"
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [supabase]);

  if (loading) return <div className="dash-pane"><div className="card" style={{ padding: 28, height: 120, opacity: 0.5 }} aria-busy="true" /></div>;
  if (loadErr) return <div className="dash-pane"><div className="card" style={{ padding: 20 }}><p className="faint" role="alert">Couldn&apos;t load your campaigns — refresh to try again.</p></div></div>;

  if (!rows || rows.length === 0) {
    return (
      <div className="dash-pane">
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--cream-200)", margin: "0 auto 12px" }}><Icon name="trophy" size={24} /></div>
          <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>Promote your business</h3>
          <p className="faint" style={{ fontSize: ".9rem", maxWidth: 440, margin: "0 auto" }}>Featured placement, homepage spotlight and category sponsorships put you in front of more of Singapore’s Muslim community. When a campaign is live, you’ll see its reach &amp; clicks here.</p>
          <button className="btn btn-gold btn-sm" style={{ marginTop: 14 }} onClick={() => navigate("advertise")}>See ad options</button>
        </div>
      </div>
    );
  }

  const money = (c: number) => `S$${Math.round(c / 100).toLocaleString()}`;
  return (
    <div className="dash-pane">
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="admin-tablehead"><h3 style={{ fontSize: "1.05rem" }}>Your campaigns</h3><button className="btn btn-gold btn-sm" onClick={() => navigate("advertise")}><Icon name="plus" size={14} /> New campaign</button></div>
        <div className="tbl-scroll"><table className="tbl">
          <thead><tr><th>Campaign</th><th>Status</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Rate</th></tr></thead>
          <tbody>{rows.map((r) => {
            const ctr = r.impressions > 0 ? Math.round((r.clicks / r.impressions) * 1000) / 10 : 0;
            return (
              <tr key={r.campaign_id} className="rowhover">
                <td style={{ fontWeight: 700 }}>{r.title}</td>
                <td><span className={`pill-tag ${r.status === "active" ? "green" : r.status === "paused" ? "amber" : ""}`}>{r.status}</span></td>
                <td>{r.impressions.toLocaleString()}</td>
                <td>{r.clicks.toLocaleString()}</td>
                <td>{ctr}%</td>
                <td className="muted">{money(r.rate_cents)}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </div>
    </div>
  );
}
