import { NotFoundScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Page not found", description: "The page you're looking for doesn't exist.", path: "/404", index: false });

export default function Page() {
  return <NotFoundScreen />;
}
