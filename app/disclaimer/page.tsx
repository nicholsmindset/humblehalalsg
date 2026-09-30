import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Halal information disclaimer",
  description: "Humble Halal publishes informational guides and does not issue halal certification. Check current status with MUIS and the venue.",
  path: "/disclaimer",
});

export default function Page() {
  return <div className="screen-in hh-page">
    <section className="seo-hero hh-pattern"><div className="hh-wrap"><span className="eyebrow">Good to know</span><h1>Halal information disclaimer</h1></div></section>
    <div className="hh-wrap hh-section" style={{ maxWidth: 800 }}>
      <p>Humble Halal publishes informational articles and tools. We do not certify businesses, products or ingredients.</p>
      <p>Certification, menus, opening hours and product ingredients can change. Before relying on a recommendation, confirm the exact outlet or product with the business and check the current <a href="https://halal.muis.gov.sg/halal/establishments" target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a> where applicable.</p>
      <p>Descriptions such as “Muslim-owned” and “no pork, no lard” do not mean an establishment holds MUIS certification. If you need formal certification, verify it directly.</p>
      <p>Found an error? <Link href="/contact">Send us a correction</Link>.</p>
    </div>
  </div>;
}
