import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: SITE.backgroundColor,
    theme_color: SITE.themeColor,
    categories: ["food", "lifestyle", "travel", "shopping"],
    icons: [
      // SVG for crisp scaling, plus raster 192/512 PNGs so Android/Chrome install
      // prompts get real bitmaps (maskable-as-SVG is weakly supported), and a
      // dedicated padded maskable so the crescent survives the circular safe-zone crop.
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/icon-512-maskable.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
