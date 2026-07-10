/* Hub 2 — server-rendered vendor list for wedding/catering directory pages.
   Draws from the REAL directory only (getDirectory — Supabase `businesses`);
   honest empty state, never fabricated vendors. ItemList JSON-LD included
   when there are real matches. */
import Link from "next/link";
import { getDirectory } from "@/lib/directory";
import { certSuffix } from "@/lib/halal-score";
import type { Listing } from "@/lib/types";
import { JsonLd, itemListJsonLd } from "@/components/seo/json-ld";

export type VendorFilter = (l: Listing) => boolean;

/** Common filters for the wedding vertical. */
export const weddingVendors: VendorFilter = (l) => l.catId === "weddings";
export const caterers: VendorFilter = (l) => {
  const hay = `${l.cuisine} ${(l.tags || []).join(" ")}`.toLowerCase();
  return hay.includes("catering") || hay.includes("caterer");
};
export const byFragments = (...frags: string[]): VendorFilter => (l) => {
  const hay = `${l.cuisine} ${l.cat} ${(l.tags || []).join(" ")} ${l.blurb}`.toLowerCase();
  return frags.some((f) => hay.includes(f));
};
export const anyOf = (...fs: VendorFilter[]): VendorFilter => (l) => fs.some((f) => f(l));

export async function VendorList({
  filter,
  listName,
  emptyNote,
  limit = 30,
}: {
  filter: VendorFilter;
  /** Name for the ItemList schema, e.g. "Halal Wedding Caterers in Singapore". */
  listName: string;
  /** Sentence shown in the honest empty state. */
  emptyNote: string;
  limit?: number;
}) {
  const all = await getDirectory();
  const vendors = all
    .filter(filter)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating || a.name.localeCompare(b.name))
    .slice(0, limit);

  if (!vendors.length) {
    return (
      <p className="muted">
        {emptyNote} Know a vendor we should list?{" "}
        <Link href="/suggest">Suggest them</Link> — or if this is your business,{" "}
        <Link href="/add-listing">list it free</Link>.
      </p>
    );
  }

  return (
    <>
      <JsonLd data={[itemListJsonLd(vendors, listName)]} />
      <ul style={{ display: "grid", gap: 14, padding: 0, margin: "0 0 8px", listStyle: "none" }}>
        {vendors.map((l) => (
          <li key={l.id} style={{ display: "flex", gap: 14, alignItems: "baseline", borderBottom: "1px solid var(--line, #ECE7DB)", paddingBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <Link href={`/business/${l.slug}`} style={{ fontWeight: 700, fontSize: "1.08rem" }}>{l.name}</Link>
              <div className="muted" style={{ fontSize: ".92rem", marginTop: 3 }}>
                {[l.cuisine, l.area, l.price].filter(Boolean).join(" · ")}
                {certSuffix(l) ? ` · ${certSuffix(l)}` : l.badges.includes("owned") ? " · Muslim-owned" : ""}
                {l.rating > 0 ? ` · ${l.rating.toFixed(1)}★ (${l.reviews})` : ""}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 6 }}>
        <Link className="btn btn-primary" href="/quotes">Request quotes from vendors</Link>
      </p>
    </>
  );
}
