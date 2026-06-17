import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { Icon } from "@/components/ui";
import { toolsByCategory, toolHref, TOOLS } from "@/lib/tools";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = pageMeta({
  title: "Free Islamic Tools — Tasbih, Duas, 99 Names, Zakat & Hijri dates",
  description:
    "A free suite of everyday Islamic tools — tasbih counter, dua library, the 99 Names of Allah, a Zakat calculator and a Hijri date converter. No sign-up, private by default.",
  path: "/tools",
});

export default function Page() {
  const groups = toolsByCategory();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Humble Halal — Islamic tools",
    numberOfItems: TOOLS.filter((t) => t.live).length,
    itemListElement: TOOLS.filter((t) => t.live).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.title,
      url: toolHref(t),
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <div className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Tools</span>
            </div>
            <span className="eyebrow">Deen tools</span>
            <h1 style={{ fontSize: "clamp(1.9rem,4.5vw,2.8rem)", maxWidth: 760, marginTop: 8 }}>
              Free Islamic tools for every day
            </h1>
            <p className="muted" style={{ maxWidth: 640, marginTop: 12, fontSize: "1.08rem" }}>
              Count your dhikr, learn duas and the 99 Names, work out your zakat, and convert Hijri dates —
              free, private, and no sign-up needed.
            </p>
            <div className="flex g8 wrap" style={{ marginTop: 16 }}>
              <span className="tag"><Icon name="shield-check" size={14} /> No sign-up</span>
              <span className="tag"><Icon name="eye" size={14} /> Private by default</span>
              <span className="tag"><Icon name="crescent" size={14} /> Free forever</span>
            </div>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {groups.map((g) => (
            <section key={g.category} className="tools-cat">
              <h2 className="tools-cat-h">{g.category}</h2>
              <div className="grid-cards">
                {g.items.map((t) => (
                  <Link key={t.slug} href={toolHref(t)} className="card card-hover tool-card">
                    <span className="tool-card-ico">
                      <Icon name={t.icon} size={22} />
                    </span>
                    <div className="tool-card-body">
                      <div className="tool-card-name">{t.title}</div>
                      <p className="tool-card-blurb">{t.blurb}</p>
                      {t.privateLocal && <span className="tag tool-card-tag"><Icon name="eye" size={12} /> On-device</span>}
                    </div>
                    <Icon name="arrow" size={18} className="tool-card-arrow" />
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <p className="faint" style={{ fontSize: ".84rem", marginTop: 8, maxWidth: 720 }}>
            More tools — Quran reader &amp; word search, prayer times, qibla, mosque &amp; halal-food finders —
            are coming to this hub. Tools marked “On-device” keep your data in this browser only; nothing is uploaded.
          </p>
        </div>
      </div>
    </>
  );
}
