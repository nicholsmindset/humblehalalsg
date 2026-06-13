import type { Metadata } from "next";
import { SavedScreen } from "@/components/screens/consumer";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({ title: "Your saved places", path: "/saved", index: false });

export default function Page() {
  return <SavedScreen />;
}
