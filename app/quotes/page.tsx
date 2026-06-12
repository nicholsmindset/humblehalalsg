import { RequestQuoteScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Request quotes from halal vendors in Singapore",
  description:
    "Get free, no-obligation quotes from trusted Muslim-owned & halal-certified vendors — catering, weddings, umrah, home services and more. We match you with relevant providers.",
  path: "/quotes",
});

export default function Page() {
  return <RequestQuoteScreen />;
}
