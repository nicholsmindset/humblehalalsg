import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { RamadanTracker } from "@/components/tools/ramadan-tracker";

export const metadata: Metadata = pageMeta({
  title: "Ramadan Fasting Tracker — mark your 30 days",
  description:
    "Track your Ramadan fasts day by day across the 30 days. Private and free — your record stays on your device, no sign-up.",
  path: "/tools/ramadan",
});

export default function Page() {
  return (
    <ToolShell
      slug="ramadan"
      title="Ramadan Tracker"
      intro="Mark each day you fast through Ramadan and watch your progress across the month. Private to this device."
    >
      <RamadanTracker />
    </ToolShell>
  );
}
