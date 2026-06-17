import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { HifzTracker } from "@/components/tools/hifz-tracker";

export const metadata: Metadata = pageMeta({
  title: "Hifz Tracker — track Quran memorization by surah",
  description:
    "Track your Quran memorization (hifz) surah by surah across all 114, with a progress bar. Free and private — your progress stays on your device.",
  path: "/tools/hifz",
});

export default function Page() {
  return (
    <ToolShell
      slug="hifz"
      title="Hifz Tracker"
      intro="Mark the surahs you've memorized and track your progress toward all 114. Private to this device."
    >
      <HifzTracker />
    </ToolShell>
  );
}
