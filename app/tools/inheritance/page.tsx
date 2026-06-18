import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { InheritanceTool } from "@/components/tools/inheritance";

export const metadata: Metadata = pageMeta({
  title: "Islamic Inheritance Calculator (Faraid) — shares for heirs",
  description:
    "A simplified Islamic inheritance (Faraid) calculator for a spouse, parents and children — with the Qur'anic fixed shares, 'awl and radd. Educational only; verify with a qualified scholar.",
  path: "/tools/inheritance",
});

export default function Page() {
  return (
    <ToolShell
      slug="inheritance"
      title="Inheritance Calculator (Faraid)"
      intro="Work out the Qur'anic shares for the most common heirs — spouse, parents and children. A simplified, educational tool: complex estates must go to a qualified faraid specialist."
    >
      <InheritanceTool />
    </ToolShell>
  );
}
