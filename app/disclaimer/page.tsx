import { DisclaimerScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Halal status disclaimer", description: "Humble Halal is a discovery platform, not a certifier. Always confirm certification on the official MUIS HalalSG register.", path: "/disclaimer" });

export default function Page() {
  return <DisclaimerScreen />;
}
