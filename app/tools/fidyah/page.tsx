import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { FidyahTool } from "@/components/tools/fidyah";

export const metadata: Metadata = pageMeta({
  title: "Fidyah Calculator Singapore — 2026 Rate ($4/day)",
  description:
    "Calculate your Fidyah for missed fasts you cannot make up, using the MUIS Singapore 2026 rate of $4 per day. Free, private, and easy to work out.",
  path: "/tools/fidyah",
  absoluteTitle: true,
});

export default function Page() {
  return (
    <ToolShell
      slug="fidyah"
      title="Fidyah Calculator (Singapore)"
      intro="Fidyah compensates for fasts you are permanently unable to make up — one meal fed to the needy per missed day. Enter the number of days to see the total at the current MUIS rate."
    >
      <FidyahTool />
    </ToolShell>
  );
}
