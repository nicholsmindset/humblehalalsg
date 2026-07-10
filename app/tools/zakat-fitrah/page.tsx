import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { ZakatFitrahTool } from "@/components/tools/zakat-fitrah";

export const metadata: Metadata = pageMeta({
  title: "Zakat Fitrah Calculator Singapore — 2026 Rates ($5 / $8)",
  description:
    "Work out your Zakat Fitrah for Singapore using the MUIS 2026 rates ($5 normal, $8 higher grade) per person. Free, private, and paid before the Eid prayer.",
  path: "/tools/zakat-fitrah",
  absoluteTitle: true,
});

export default function Page() {
  return (
    <ToolShell
      slug="zakat-fitrah"
      title="Zakat Fitrah Calculator (Singapore)"
      intro="Zakat Fitrah is paid on behalf of every person in your household before the Eid prayer. Enter your headcount and pick the MUIS rate for the year to see the total due."
    >
      <ZakatFitrahTool />
    </ToolShell>
  );
}
