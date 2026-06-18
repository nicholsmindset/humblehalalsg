import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { KhatamTracker } from "@/components/tools/khatam-tracker";

export const metadata: Metadata = pageMeta({
  title: "Khatam Tracker — complete a 30-juz Quran read-through",
  description:
    "Track your Quran khatam juz by juz across all 30, then start a new read-through. Free and private — progress stays on your device.",
  path: "/tools/khatam",
});

export default function Page() {
  return (
    <ToolShell
      slug="khatam"
      title="Khatam Tracker"
      intro="Work through all 30 juz of the Qur'an, then begin a fresh khatam. Private to this device."
    >
      <KhatamTracker />
    </ToolShell>
  );
}
