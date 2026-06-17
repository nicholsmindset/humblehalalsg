import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { SalahTracker } from "@/components/tools/salah-tracker";

export const metadata: Metadata = pageMeta({
  title: "Salah Tracker — log your 5 daily prayers & streak",
  description:
    "A simple, private salah tracker: tick off Fajr, Dhuhr, Asr, Maghrib and Isha each day and build a streak. No sign-up — data stays on your device.",
  path: "/tools/salah-tracker",
});

export default function Page() {
  return (
    <ToolShell
      slug="salah-tracker"
      title="Salah Tracker"
      intro="Tick off the five daily prayers and build a streak. Your log is private to this device."
    >
      <SalahTracker />
    </ToolShell>
  );
}
