import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerFlags } from "@/lib/flags";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { pageMeta } from "@/lib/seo";
import { tierFor, badgesFor, BADGES } from "@/lib/passport";
import { PublicPassport } from "@/components/passport/public-passport";

/* Public, no-login shareable passport. The opaque token resolves to non-PII
   aggregates via public_passport_by_token (only when the owner opted in). */
export const dynamic = "force-dynamic";

type Row = { display_name: string; total_points: number; visit_count: number; review_count: number; follow_count: number; joined_month: string };

async function load(token: string): Promise<Row | null> {
  if (!getServerFlags().passport) return null;
  const db = getSupabaseAdmin();
  if (!db) return null;
  try {
    const { data } = await db.rpc("public_passport_by_token", { p_token: token });
    const row = Array.isArray(data) ? data[0] : data;
    return (row as Row) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const row = await load(token);
  if (!row) return pageMeta({ title: "Halal Passport", path: `/passport/${token}`, index: false });
  const tier = tierFor(row.total_points);
  return pageMeta({
    title: `${row.display_name} — ${tier.label} on Humble Halal`,
    description: `${row.display_name} has ${row.total_points} Halal Passport points, visited ${row.visit_count} halal spots and written ${row.review_count} reviews.`,
    path: `/passport/${token}`,
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!getServerFlags().passport) notFound();
  const row = await load(token);
  if (!row) {
    return (
      <div className="screen-in hh-page"><div className="hh-wrap" style={{ maxWidth: 480, paddingTop: 48, textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <h1 style={{ fontSize: "1.4rem", marginTop: 8 }}>This passport is private</h1>
        <p className="muted" style={{ marginTop: 6 }}>This link isn&apos;t available. Start your own Halal Passport on Humble Halal.</p>
        <Link className="btn btn-primary mt16" href="/passport">Create your passport</Link>
      </div></div>
    );
  }
  const tier = tierFor(row.total_points);
  const earned = badgesFor({ totalPoints: row.total_points, reviewCount: row.review_count, visitCount: row.visit_count, followCount: row.follow_count, streakDays: 0, qualifiedReferrals: 0 });
  const badges = BADGES.filter((b) => earned.includes(b.key)).map((b) => ({ key: b.key, label: b.label, icon: b.icon }));
  return <PublicPassport row={row} tier={tier.label} badges={badges} />;
}
