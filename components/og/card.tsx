/* Shared Open Graph card template (1200×630) for next/og ImageResponse routes.
   Brand palette (cream / teal / gold), reused by app/opengraph-image.tsx and the
   per-entity OG routes (blog post, is-halal verdict, pSEO). Returns JSX — pass it
   straight to `new ImageResponse(OgCard({...}), { width, height })`. */
import { SITE } from "@/lib/seo";

export interface OgCardProps {
  /** Small uppercase eyebrow, e.g. the category or "Is it halal?". */
  kicker?: string;
  /** The headline. */
  title: string;
  /** Optional supporting line under the title. */
  subtitle?: string;
  /** Optional status chip (e.g. a halal verdict), rendered top-right. */
  badge?: string;
}

export function OgCard({ kicker, title, subtitle, badge }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#F8F6F1",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#12525B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="42" height="42" viewBox="0 0 64 64">
              <path
                d="M41 41a13 13 0 11-13-23 10.4 10.4 0 0013 23z"
                fill="none"
                stroke="#C97D3F"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#1F2933" }}>{SITE.name}</div>
            <div style={{ fontSize: 16, letterSpacing: 4, color: "#A96430", textTransform: "uppercase" }}>
              {kicker || "Singapore"}
            </div>
          </div>
        </div>
        {badge ? (
          <div
            style={{
              fontSize: 24,
              color: "#F8F6F1",
              background: "#12525B",
              padding: "10px 22px",
              borderRadius: 999,
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 60, fontWeight: 700, color: "#12525B", lineHeight: 1.12, maxWidth: 1000 }}>
          {title.length > 110 ? title.slice(0, 107) + "…" : title}
        </div>
        <div style={{ fontSize: 26, color: "#586471" }}>
          {subtitle || "MUIS-certified · Muslim-owned · trusted by the community"}
        </div>
      </div>
    </div>
  );
}
