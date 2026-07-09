import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#12525B",
          borderRadius: 40,
        }}
      >
        <svg width="110" height="110" viewBox="0 0 64 64">
          <path
            d="M41 41a13 13 0 11-13-23 10.4 10.4 0 0013 23z"
            fill="none"
            stroke="#C97D3F"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
