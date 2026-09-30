import { ContactScreen } from "@/components/screens/pages";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({ title: "Contact Humble Halal", description: "Get in touch about a guide, tool, newsletter or privacy request.", path: "/contact" });

export default function Page() {
  return (<><JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])]} /><ContactScreen /></>);
}
