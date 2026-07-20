import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

/* Malay-language pair of /halal-food-singapore (hreflang-lite; see
   lib/ms-pages.ts). Original Bahasa Melayu prose for Malay-first searches
   ("makanan halal Singapura", "tempat makan halal") — not a literal translation. */

export const metadata: Metadata = pageMeta({
  title: "Makanan Halal Singapura — Panduan Tempat Makan Halal & Muslim",
  description:
    "Panduan makanan halal di Singapura — restoran bersijil halal MUIS, perniagaan milik orang Islam dan gerai hawker, mengikut kawasan, pusat beli-belah dan jenis masakan. Fahami beza sijil halal MUIS dan 'no pork no lard'.",
  path: "/ms/makanan-halal-singapura",
  absoluteTitle: true,
  languages: {
    "en-SG": "/halal-food-singapore",
    ms: "/ms/makanan-halal-singapura",
    "x-default": "/halal-food-singapore",
  },
});

const FAQ = [
  { q: "Bagaimana nak tahu restoran di Singapura betul-betul halal?", a: "Cara paling pasti ialah melihat sijil halal MUIS — badan berkuasa halal rasmi Singapura. Di Humble Halal, setiap senarai dilabel sama ada Bersijil MUIS, Milik Orang Islam atau akuan sendiri, dengan skor keyakinan halal. Untuk pengesahan rasmi, semak daftar HalalSG di laman MUIS." },
  { q: "Adakah 'no pork no lard' sama dengan halal?", a: "Tidak. 'No pork, no lard' hanyalah akuan sendiri pihak restoran dan BUKAN setaraf dengan sijil halal MUIS — bahan seperti arak dalam masakan, daging yang tidak disembelih mengikut syarak atau percampuran peralatan mungkin masih wujud. Kami melabelkan premis akuan sendiri dengan jelas supaya anda boleh membuat pilihan sendiri." },
  { q: "Di mana kawasan makanan halal paling banyak di Singapura?", a: "Geylang Serai, Kampong Glam (Arab Street), Bedok dan Tampines terkenal dengan pilihan halal yang padat, manakala pusat beli-belah seperti Jewel Changi, VivoCity, Northpoint City dan Jurong Point mempunyai kelompok restoran halal yang kuat." },
  { q: "Apakah maksud 'milik orang Islam' (Muslim-owned)?", a: "Perniagaan milik orang Islam dimiliki dan diusahakan oleh umat Islam tetapi mungkin belum memegang sijil halal MUIS — kebiasaannya kerana kos atau saiz operasi. Ramai yang berpegang penuh pada sumber halal; kami memaparkan status ini secara telus bersama skor keyakinan halal setiap senarai." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Laman Utama", path: "/" },
            { name: "Makanan halal Singapura", path: "/ms/makanan-halal-singapura" },
          ]),
        ]}
      />
      <div className="screen-in hh-page" lang="ms">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Laman Utama</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Makanan halal Singapura</span>
            </nav>
            <span className="eyebrow">Panduan halal</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Makanan Halal di Singapura — Panduan Lengkap</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>Singapura antara syurga makanan halal terbaik di dunia</strong> — ribuan restoran bersijil halal
              MUIS, perniagaan milik orang Islam dan gerai hawker di setiap kejiranan. Panduan ini membantu anda mencari
              tempat makan mengikut kawasan, pusat beli-belah dan jenis masakan, dengan status halal yang jelas pada
              setiap senarai.
            </p>
            <p className="faint" style={{ marginTop: 12, fontSize: ".92rem" }}>
              <Link className="link-inline" href="/halal-food-singapore" lang="en">View this guide in English →</Link>
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="seo-prose" style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Sijil halal MUIS, milik orang Islam, atau akuan sendiri?</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Tidak semua yang kelihatan &ldquo;mesra Muslim&rdquo; itu sama. <strong>Sijil halal MUIS</strong> ialah
              pengiktirafan rasmi badan berkuasa halal Singapura — premis diaudit dari sumber bahan hingga ke dapur.{" "}
              <strong>Milik orang Islam</strong> pula bermakna perniagaan itu diusahakan oleh umat Islam, walaupun
              mungkin belum bersijil. Manakala tanda <em>&ldquo;no pork no lard&rdquo;</em> hanyalah akuan sendiri dan
              bukan jaminan halal. Di direktori kami, ketiga-tiga status ini dilabel dengan jelas berserta skor
              keyakinan halal, supaya anda boleh membuat keputusan dengan tenang. Ragu-ragu tentang sesuatu jenama?
              Gunakan <Link className="link-inline" href="/is-halal">semakan status halal</Link> kami, dan sahkan sijil
              di daftar rasmi HalalSG.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Cari mengikut kawasan dan pusat beli-belah</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Mahu makan berdekatan rumah atau tempat kerja? Kawasan seperti <strong>Geylang Serai</strong>,{" "}
              <strong>Kampong Glam</strong>, Bedok dan Tampines memang padat dengan pilihan halal — dari nasi padang
              dan mee rebus ke kafe moden milik anak muda Melayu. Pusat beli-belah utama seperti Jewel Changi, VivoCity
              dan Northpoint City juga mempunyai kelompok restoran halal yang besar.{" "}
              <Link className="link-inline" href="/explore">Terokai direktori halal kami</Link> untuk menapis mengikut
              kawasan dan kategori, atau gunakan{" "}
              <Link className="link-inline" href="/halal-food-near-me">carian makanan halal berdekatan anda</Link>{" "}
              untuk pilihan terpantas.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Gerai hawker halal — makanan rakyat</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Jiwa makanan Singapura tetap di medan selera. Dari nasi lemak dan mee soto di Geylang Serai hingga
              ayam penyet di Bedok, ratusan gerai hawker halal dan milik orang Islam menghidangkan juadah harian
              dengan harga berpatutan. Gunakan <Link className="link-inline" href="/hawker">carian hawker halal</Link>{" "}
              kami untuk melihat gerai mengikut medan selera, lengkap dengan status halal setiap gerai.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Untuk majlis dan musim perayaan</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Merancang kenduri, majlis di pejabat atau rumah terbuka? Ada banyak penyedia katering halal di Singapura,
              dari pakej nasi ambeng hingga buffet penuh —{" "}
              <Link className="link-inline" href="/halal-catering-singapore">lihat panduan katering halal</Link> kami.
              Pada bulan Ramadan dan musim Raya, semak juga <Link className="link-inline" href="/ms/ramadan">panduan
              Ramadan</Link> dan <Link className="link-inline" href="/ms/hari-raya">panduan Hari Raya</Link> untuk
              tempat berbuka, bazar dan katering perayaan. Dan sebelum keluar makan, jangan lupa semak{" "}
              <Link className="link-inline" href="/waktu-solat-singapore">waktu solat</Link> — kebanyakan pusat
              beli-belah utama ada bilik solat berdekatan.
            </p>
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Mula di sini</h2>
          <div className="hub-grid">
            <Link href="/explore" className="hub-link"><span>Terokai direktori halal</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-food-near-me" className="hub-link"><span>Makanan halal berdekatan saya</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/hawker" className="hub-link"><span>Gerai hawker halal</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/is-halal" className="hub-link"><span>Semakan status halal jenama</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/mosques" className="hub-link"><span>Masjid di Singapura</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-food-singapore" className="hub-link"><span lang="en">Halal food guide in English</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <section className="newsletter-card mt24" style={{ maxWidth: 640 }}>
            <span className="eyebrow" style={{ color: "var(--emerald)" }}>🍽 Panduan halal mingguan</span>
            <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Tempat makan halal baharu, setiap minggu</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Restoran halal baru dibuka, gerai hawker tersembunyi dan panduan bermanfaat untuk keluarga Muslim di
              Singapura — terus ke e-mel anda.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="ms-makanan-halal" cta="Langgan" />
            </div>
          </section>

          <div className="seo-prose mt24" style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 12px" }}>Soalan lazim</h2>
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item" name="ms-makanan-faq">
                <summary>{f.q}<span className="faq-chevron" aria-hidden="true" /></summary>
                <p className="muted" style={{ padding: "8px 0" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
