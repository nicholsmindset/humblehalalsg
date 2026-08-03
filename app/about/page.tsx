import { AboutScreen } from "@/components/screens/pages";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({ title: "About Humble Halal — Singapore halal directory", description: "Humble Halal helps Muslims discover halal and Muslim-owned businesses across Singapore with clear trust signals. A discovery platform, not a certifier.", path: "/about" });

const org = { "@context": "https://schema.org", "@type": "Organization", name: "Humble Halal", url: SITE.url, description: "Singapore halal and Muslim-owned business directory.", legalName: "ONN GROUP LLP", address: { "@type": "PostalAddress", streetAddress: "60 Paya Lebar Road, #06-28 Paya Lebar Square", addressLocality: "Singapore", postalCode: "409051", addressCountry: "SG" } };

export default function Page() {
  return (<><JsonLd data={[org, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])]} /><AboutScreen /></>);
}
