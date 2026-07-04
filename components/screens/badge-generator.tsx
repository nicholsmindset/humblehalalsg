"use client";

/* Badge generator — a business enters its listing slug (or arrives with
   ?slug= from the owner dashboard), previews the embeddable badge, and copies
   a paste-ready snippet. The <a> wrapper is the point: a do-follow backlink to
   the listing with UTM so referral traffic is attributable (lib/attribution.ts). */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "../ui";

const SITE = "https://www.humblehalal.com";
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export function BadgeGeneratorScreen() {
  const search = useSearchParams();
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = (search.get("slug") || "").toLowerCase();
    if (SLUG_RE.test(s)) setSlug(s);
  }, [search]);

  const clean = slug.trim().toLowerCase();
  const valid = SLUG_RE.test(clean);
  const badgeUrl = `${SITE}/api/badge/${clean}${theme === "dark" ? "?theme=dark" : ""}`;
  const linkUrl = `${SITE}/business/${clean}?utm_source=badge&utm_medium=embed&utm_campaign=verified-badge`;
  const snippet = `<a href="${linkUrl}" target="_blank" rel="noopener">
  <img src="${badgeUrl}" alt="Verified Halal on Humble Halal" width="200" height="56" loading="lazy" />
</a>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — user can select manually */ }
  };

  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap" style={{ maxWidth: 720, paddingTop: 28, paddingBottom: 48 }}>
        <span className="eyebrow">For businesses</span>
        <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.3rem)", marginTop: 8 }}>Add your Humble Halal badge</h1>
        <p className="muted" style={{ marginTop: 8, fontSize: "1.02rem" }}>
          Show visitors you&apos;re on Singapore&apos;s halal directory. Paste this badge on your website or online
          store — it links back to your listing so customers can read your halal status, reviews and directions.
        </p>

        <div className="card" style={{ padding: 20, marginTop: 22 }}>
          <div className="field">
            <label htmlFor="badge-slug">Your listing address</label>
            <div className="flex g8 center" style={{ flexWrap: "wrap" }}>
              <span className="faint" style={{ fontSize: ".9rem" }}>humblehalal.com/business/</span>
              <input
                id="badge-slug" className="input" placeholder="your-business-name"
                value={slug} onChange={(e) => setSlug(e.target.value)} style={{ flex: 1, minWidth: 180 }}
                aria-invalid={!!slug && !valid}
              />
            </div>
            <span className="hint">The last part of your listing&apos;s web address. Not sure? Open your listing and copy it from the URL.</span>
          </div>

          <div className="field">
            <label>Style</label>
            <div className="flex g8">
              <button className={`chip ${theme === "light" ? "active" : ""}`} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</button>
              <button className={`chip ${theme === "dark" ? "active" : ""}`} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
            </div>
          </div>

          {valid ? (
            <>
              <div className="field">
                <label>Preview</label>
                <div style={{ padding: 20, borderRadius: 12, background: theme === "dark" ? "#0a1f19" : "var(--wash,#f6f4ee)", display: "flex", justifyContent: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={badgeUrl} alt="Verified Halal on Humble Halal preview" width={200} height={56} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="badge-code">Copy this code onto your website</label>
                <textarea id="badge-code" className="textarea" readOnly value={snippet} rows={4} style={{ fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: ".82rem" }} onFocus={(e) => e.currentTarget.select()} />
                <button className="btn btn-primary mt8" onClick={copy}>
                  <Icon name={copied ? "check" : "doc"} size={16} /> {copied ? "Copied!" : "Copy code"}
                </button>
              </div>
              <p className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>
                Works on any website builder that accepts HTML (Wix, Squarespace, WordPress, Shopify, Linktree and more).
              </p>
            </>
          ) : (
            <p className="faint" style={{ marginTop: 8 }}>Enter your listing address above to preview and copy your badge.</p>
          )}
        </div>
      </div>
    </div>
  );
}
