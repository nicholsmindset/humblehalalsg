import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { TasbihTool } from "@/components/tools/tasbih";

export const metadata: Metadata = pageMeta({
  title: "Tasbih Counter — digital misbaha for dhikr",
  description:
    "A free digital tasbih (misbaha) counter for dhikr — SubhanAllah, Alhamdulillah, Allahu Akbar and more. Counts stay on your device. No sign-up.",
  path: "/tools/tasbih",
});

export default function Page() {
  return (
    <ToolShell
      slug="tasbih"
      title="Tasbih Counter"
      intro="A digital misbaha for your dhikr. Pick a phrase, set your count, and tap. Your tally is kept privately on this device."
    >
      <TasbihTool />
    </ToolShell>
  );
}
