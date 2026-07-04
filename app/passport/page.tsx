import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { getServerFlags } from "@/lib/flags";
import { PassportScreen } from "@/components/screens/passport";

export const metadata = pageMeta({ title: "Your Halal Passport", description: "Earn points, collect stamps and unlock badges across Singapore's halal spots.", path: "/passport", index: false });
export const dynamic = "force-dynamic";

export default function Page() {
  if (!getServerFlags().passport) notFound();
  return <PassportScreen />;
}
