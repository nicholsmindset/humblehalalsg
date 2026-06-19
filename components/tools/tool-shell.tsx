/* Server component — shared chrome for an individual tool page: breadcrumb,
   hero, BreadcrumbList JSON-LD, and a slot for the tool. Mirrors the page
   structure used across the app (see app/mosques/page.tsx). */
import Link from "next/link";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { ToolCta } from "@/components/tool-cta";

export function ToolShell({
  title,
  intro,
  slug,
  children,
  foot,
}: {
  title: string;
  intro: string;
  slug: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: title, path: `/tools/${slug}` },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <div className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <Link className="link-inline" href="/tools">Tools</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>{title}</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>{title}</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              {intro}
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="tool-stage">{children}</div>
          {foot}
          <ToolCta slug={slug} />
        </div>
      </div>
    </>
  );
}
