import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { toolHref, TOOLS } from "@/lib/tools";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { ToolsHub } from "@/components/tools/tools-hub";

export const metadata: Metadata = pageMeta({
  title: "Free Islamic Tools — Prayer Times, Quran, Zakat & Duas",
  description:
    "Free everyday Islamic tools: prayer times, Quran reader, qibla finder, Zakat calculator, tasbih, duas and the 99 Names. No sign-up, private by default.",
  path: "/tools",
  absoluteTitle: true,
});

export default function Page() {
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
        <ToolsHub tools={TOOLS} />
      </div>
    </>
  );
}
