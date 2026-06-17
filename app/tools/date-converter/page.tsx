import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { DateConverterTool } from "@/components/tools/date-converter";

export const metadata: Metadata = pageMeta({
  title: "Hijri Date Converter — Islamic to Gregorian dates",
  description:
    "Convert between the Hijri (Islamic) calendar and the Gregorian calendar both ways. Free, instant, and works offline in your browser.",
  path: "/tools/date-converter",
});

export default function Page() {
  return (
    <ToolShell
      slug="date-converter"
      title="Hijri Date Converter"
      intro="Convert between Hijri and Gregorian dates in both directions. Useful for planning Ramadan, Hajj and Islamic milestones."
    >
      <DateConverterTool />
    </ToolShell>
  );
}
