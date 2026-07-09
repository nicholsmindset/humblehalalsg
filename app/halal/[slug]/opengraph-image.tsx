import { ImageResponse } from "next/og";
import { getSeoPage } from "@/lib/seo-pages";
import { SITE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Halal in Singapore";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getSeoPage(slug);
  const h1 = p?.h1 ?? "Halal in Singapore";
  const intro = p?.intro ?? SITE.tagline;

  return new ImageResponse(
    (
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, color: "#A96430", letterSpacing: 3 }}>
          HUMBLE HALAL · SINGAPORE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 70, fontWeight: 700, color: "#12525B", lineHeight: 1.05, maxWidth: 1000 }}>{h1}</div>
          <div style={{ fontSize: 30, color: "#586471", maxWidth: 920 }}>{intro}</div>
        </div>
        <div style={{ fontSize: 26, color: "#12525B", fontWeight: 700 }}>{SITE.url.replace(/^https?:\/\//, "")}</div>
      </div>
    ),
    { ...size },
  );
}
