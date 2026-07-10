import { ImageResponse } from "next/og";
import { getListingBySlug } from "@/lib/directory";
import { SITE } from "@/lib/seo";
import { muisUnbacked } from "@/lib/halal-score";

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
  // Social-card chip text: full "Certified" only with a cert on file.
  const certChip = l && certified ? (muisUnbacked(l) ? "MUIS-listed Halal" : `${l.certBody} Certified Halal`) : "";

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
          background: "#12525B",
          fontFamily: "Georgia, serif",
          color: "#F8F6F1",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, color: "#C97D3F", letterSpacing: 3 }}>
          HUMBLE HALAL · SINGAPORE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {certChip && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#C97D3F",
                color: "#3a2c08",
                fontSize: 24,
                fontWeight: 700,
                padding: "8px 20px",
                borderRadius: 999,
              }}
            >
              ✓ {certChip}
            </div>
          )}
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>{name}</div>
          <div style={{ fontSize: 32, color: "#DCE9EA" }}>{meta}</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#C97D3F" }}>{rating}</div>
      </div>
    ),
    { ...size },
  );
}
