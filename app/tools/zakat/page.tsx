import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { ZakatTool } from "@/components/tools/zakat";

export const metadata: Metadata = pageMeta({
  title: "Zakat Calculator — work out the 2.5% due on your wealth",
  description:
    "A free Zakat calculator: add your cash, gold, silver, investments and debts to see whether you're above the nisab and how much Zakat is due (2.5%). Private — nothing is stored.",
  path: "/tools/zakat",
});

export default function Page() {
  return (
    <ToolShell
      slug="zakat"
      title="Zakat Calculator"
      intro="Add your zakatable assets and debts to see whether you're above the nisab and the 2.5% Zakat due. A starting estimate — verify complex cases with a knowledgeable person."
    >
      <ZakatTool />
    </ToolShell>
  );
}
