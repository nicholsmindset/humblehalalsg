import { TravelSavedScreen } from "@/components/screens/travel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Saved stays",
  description: "Hotels you've saved on Humble Halal to compare and book later.",
  path: "/travel/saved",
  index: false,
});

export default function Page() {
  return <TravelSavedScreen />;
}
