import { ReportScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Report incorrect info", description: "Report incorrect halal status, hours or details on a Humble Halal listing.", path: "/report", index: false });

export default function Page() {
  return <ReportScreen />;
}
