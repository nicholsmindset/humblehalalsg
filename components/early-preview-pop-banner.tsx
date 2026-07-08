"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hh-early-preview-pop-banner-dismissed";

export function EarlyPreviewPopBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore storage failures; the banner can still be dismissed for this session.
    }
  };

  if (!visible || process.env.NEXT_PUBLIC_PRELAUNCH === "0") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 18,
        zIndex: 80,
        width: "min(calc(100% - 28px), 520px)",
        transform: "translateX(-50%)",
        border: "1px solid rgba(255,255,255,.2)",
        borderRadius: 8,
        background: "var(--emerald)",
        color: "#fff",
        boxShadow: "0 18px 45px rgba(0,0,0,.22)",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: ".9rem", fontWeight: 800, lineHeight: 1.25 }}>Early preview</div>
          <p style={{ margin: "5px 0 0", color: "rgba(255,255,255,.9)", fontSize: ".88rem", lineHeight: 1.45 }}>
            Humble Halal is launching soon — we&apos;re still adding listings &amp; features. Have a look
            around, and subscribe below for launch updates.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss early preview notice"
          onClick={dismiss}
          style={{
            width: 30,
            height: 30,
            border: 0,
            borderRadius: 8,
            background: "rgba(255,255,255,.12)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
