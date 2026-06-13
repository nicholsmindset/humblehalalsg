import { ImageResponse } from "next/og";
import { getListingBySlug } from "@/lib/directory";
import { SITE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Business on Humble Halal";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  const name = l?.name ?? SITE.name;
  const meta = l ? `${l.cuisine} · ${l.area}` : SITE.tagline;
  const rating = l ? `★ ${l.rating} (${l.reviews})` : "";
  const certified = l?.certified;

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
          background: "#0F5C4A",
          fontFamily: "Georgia, serif",
          color: "#FAF7EF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, color: "#D6A84F", letterSpacing: 3 }}>
          HUMBLE HALAL · SINGAPORE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {certified && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#D6A84F",
                color: "#3a2c08",
                fontSize: 24,
                fontWeight: 700,
                padding: "8px 20px",
                borderRadius: 999,
              }}
            >
              ✓ {l?.certBody} Certified Halal
            </div>
          )}
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>{name}</div>
          <div style={{ fontSize: 32, color: "#DDEAE4" }}>{meta}</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#D6A84F" }}>{rating}</div>
      </div>
    ),
    { ...size },
  );
}
