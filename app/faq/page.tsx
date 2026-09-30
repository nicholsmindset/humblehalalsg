import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Frequently asked questions", description: "How to use Humble Halal's guides and free tools.", path: "/faq" });

const questions = [
  { q: "Does Humble Halal certify restaurants?", a: "No. Humble Halal is an independent informational publication, not a halal certifier. Check the latest status with the business and the official certification source." },
  { q: "Are the tools free?", a: "Yes. The tools on this site are free to use." },
  { q: "How often are guides updated?", a: "We review guides as information changes. Each article shows its publication or update date. Check time-sensitive details before you visit or buy." },
  { q: "How do I contact the team?", a: "Use our contact page to send a correction or question." },
];

export default function Page() {
  return <div className="screen-in hh-page">
    <section className="seo-hero hh-pattern"><div className="hh-wrap"><span className="eyebrow">Help</span><h1>Frequently asked questions</h1></div></section>
    <div className="hh-wrap hh-section" style={{ maxWidth: 800 }}>
      {questions.map(({ q, a }) => <details className="faq-item" key={q}><summary>{q}<span className="faq-chevron" aria-hidden="true" /></summary><p className="muted">{a}</p></details>)}
      <p style={{ marginTop: 24 }}>Still have a question? <Link href="/contact">Contact us</Link>.</p>
    </div>
  </div>;
}
