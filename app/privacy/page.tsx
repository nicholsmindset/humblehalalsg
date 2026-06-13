import type { Metadata } from "next";
import { legalDocs } from "@/lib/legal-content";
import { pageMeta } from "@/lib/seo";
import { LegalDocView } from "@/components/legal-doc";

const doc = legalDocs.privacy;
export const metadata: Metadata = pageMeta({ title: doc.title, description: doc.intro.slice(0, 155), path: "/privacy" });
export default function Page() {
  return <LegalDocView doc={doc} />;
}
