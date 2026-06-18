import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { HalalStocks } from "@/components/tools/halal-stocks";

export const metadata: Metadata = pageMeta({
  title: "Halal Stock Screener — check shares against Shariah ratios",
  description:
    "A free Shariah stock screener: check a company's business activity and AAOIFI-style financial ratios (debt, interest-bearing securities, non-compliant income) to gauge compliance. Informational only.",
  path: "/tools/halal-stocks",
});

export default function Page() {
  return (
    <ToolShell
      slug="halal-stocks"
      title="Halal Stock Screener"
      intro="Check whether a company looks Shariah-compliant using a business-activity screen and AAOIFI-style financial ratios. Beta — informational only, not investment advice."
    >
      <HalalStocks />
    </ToolShell>
  );
}
