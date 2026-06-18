import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { SadaqahLog } from "@/components/tools/sadaqah-log";

export const metadata: Metadata = pageMeta({
  title: "Sadaqah Log — track your charity & giving goal",
  description:
    "Keep a private log of your sadaqah (charity), see your running total, and set an optional giving goal. Free — entries stay on your device.",
  path: "/tools/sadaqah",
});

export default function Page() {
  return (
    <ToolShell
      slug="sadaqah"
      title="Sadaqah Log"
      intro="Record your charity, track a running total, and set an optional goal. A private record kept on this device."
    >
      <SadaqahLog />
    </ToolShell>
  );
}
