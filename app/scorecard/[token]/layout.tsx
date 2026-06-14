import { pageMeta } from "@/lib/seo";

// Private, per-vendor scorecard links — give them a title/description for sharing
// but keep them out of the index (they're token-gated, not public pages).
export const metadata = pageMeta({
  title: "Your listing performance — Humble Halal",
  description: "Private vendor performance scorecard.",
  path: "/scorecard",
  index: false,
});

export default function ScorecardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
