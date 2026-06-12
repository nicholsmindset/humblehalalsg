import { SuggestScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Suggest a halal business", description: "Know a great halal or Muslim-owned spot we're missing? Suggest it and help the Singapore Muslim community discover it.", path: "/suggest" });

export default function Page() {
  return <SuggestScreen />;
}
