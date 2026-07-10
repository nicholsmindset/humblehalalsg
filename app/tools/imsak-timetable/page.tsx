import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { ImsakTimetableTool } from "@/components/tools/imsak-timetable";

export const metadata: Metadata = pageMeta({
  title: "Imsak & Iftar Times Singapore — Suhoor & Buka Puasa",
  description:
    "Today's Imsak (end of suhoor) and Iftar (buka puasa) times for Singapore, plus all daily prayer times — from the official MUIS timetable. Free and private.",
  path: "/tools/imsak-timetable",
  absoluteTitle: true,
});

export default function Page() {
  return (
    <ToolShell
      slug="imsak-timetable"
      title="Imsak & Iftar Times (Singapore)"
      intro="Your Ramadan fasting day at a glance — Imsak marks the end of suhoor and Iftar is at Maghrib, both from the official MUIS times for Singapore, with all daily prayer times below."
    >
      <ImsakTimetableTool />
    </ToolShell>
  );
}
