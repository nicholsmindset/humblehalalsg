import { ContactScreen } from "@/components/screens/pages";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({ title: "Contact Humble Halal — support, partnerships & feedback", description: "Get in touch with the Humble Halal team — general support, business & advertising partnerships, and privacy requests. We aim to reply within 1–2 business days.", path: "/contact" });

export default function Page() {
  return (<><JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])]} /><ContactScreen /></>);
}
