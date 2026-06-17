import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { QiblaTool } from "@/components/tools/qibla";

export const metadata: Metadata = pageMeta({
  title: "Qibla Compass — find the direction of prayer",
  description:
    "A free Qibla compass that points toward the Kaaba in Makkah from your current location. Works in your browser — no app, no sign-up.",
  path: "/tools/qibla",
});

export default function Page() {
  return (
    <ToolShell
      slug="qibla"
      title="Qibla Compass"
      intro="Find the direction of prayer toward the Kaaba in Makkah from wherever you are. Allow location access, and on a phone the live compass will guide you."
    >
      <QiblaTool />
    </ToolShell>
  );
}
