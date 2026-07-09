import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.name;

export default function OgImage() {
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
            <div style={{ fontSize: 40, fontWeight: 700, color: "#1F2933" }}>{SITE.name}</div>
            <div style={{ fontSize: 18, letterSpacing: 4, color: "#A96430", textTransform: "uppercase" }}>
              Singapore
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#12525B", lineHeight: 1.1, maxWidth: 900 }}>
            Find halal food &amp; Muslim-friendly businesses in Singapore
          </div>
          <div style={{ fontSize: 28, color: "#586471" }}>
            MUIS-certified · Muslim-owned · trusted by the community
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
