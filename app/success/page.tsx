import { SuccessScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Success", description: "Your submission was received.", path: "/success", index: false });

export default function Page() {
  return <SuccessScreen />;
}
