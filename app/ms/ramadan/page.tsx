import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

/* Malay-language pair of /ramadan (hreflang-lite; see lib/ms-pages.ts).
   Original Bahasa Melayu prose for Malay-first searches ("panduan Ramadan
   Singapura", "bila mula puasa 2026") — not a literal translation. */

export const metadata: Metadata = pageMeta({
  title: "Panduan Ramadan 2026 Singapura — Tarikh Puasa, Bazar & Iftar",
  description:
    "Bila mula puasa 2026? Ramadan dijangka bermula sekitar 18 Februari 2026 di Singapura. Panduan lengkap waktu sahur dan berbuka, bazar Ramadan Geylang Serai, terawih dan persiapan Raya.",
  path: "/ms/ramadan",
  absoluteTitle: true,
  languages: {
    "en-SG": "/ramadan",
    ms: "/ms/ramadan",
    "x-default": "/ramadan",
  },
});

const FAQ = [
  { q: "Bila mula puasa Ramadan 2026 di Singapura?", a: "Ramadan 1447H dijangka bermula pada atau sekitar 18 Februari 2026, tertakluk kepada rukyah anak bulan yang disahkan secara rasmi oleh Pejabat Mufti (MUIS). Hari pertama puasa akan diumumkan selepas pengisytiharan tersebut." },
  { q: "Pukul berapa waktu berbuka puasa di Singapura?", a: "Waktu berbuka mengikut masuknya waktu Maghrib, biasanya sekitar 7.15 hingga 7.30 malam di Singapura, dan berubah sedikit setiap hari. Semak jadual harian di halaman waktu solat kami sebelum berbuka dan bersahur." },
  { q: "Di mana bazar Ramadan di Singapura?", a: "Bazar Ramadan yang terbesar dan paling terkenal ialah di Geylang Serai, di samping bazar-bazar kejiranan di kawasan seperti Tampines, Woodlands dan Jurong. Bazar biasanya bermula pada minggu-minggu Ramadan sehingga malam Hari Raya." },
  { q: "Bila Hari Raya Aidilfitri 2026?", a: "Hari Raya Aidilfitri 2026 dijangka jatuh pada atau sekitar 20 Mac 2026, menandakan berakhirnya Ramadan — tertakluk kepada rukyah anak bulan Syawal yang disahkan oleh MUIS." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Laman Utama", path: "/" },
            { name: "Panduan Ramadan 2026", path: "/ms/ramadan" },
          ]),
        ]}
      />
      <div className="screen-in hh-page" lang="ms">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Laman Utama</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Ramadan 2026</span>
            </nav>
            <span className="eyebrow">Panduan Ramadan</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Panduan Ramadan 2026 di Singapura</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>Ramadan 2026 (1447H) dijangka bermula sekitar 18 Februari 2026</strong>, tertakluk kepada rukyah
              anak bulan yang disahkan oleh MUIS. Ini panduan lengkap untuk umat Islam di Singapura — waktu sahur dan
              berbuka, bazar Ramadan, solat terawih dan persiapan menyambut Aidilfitri.
            </p>
            <p className="faint" style={{ marginTop: 12, fontSize: ".92rem" }}>
              <Link className="link-inline" href="/ramadan" lang="en">View this guide in English →</Link>
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="seo-prose" style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Tarikh-tarikh penting Ramadan 1447H</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Berdasarkan takwim Hijrah, hari pertama puasa dijangka jatuh sekitar <strong>18 Februari 2026</strong>,
              manakala Hari Raya Aidilfitri dijangka sekitar <strong>20 Mac 2026</strong>. Kedua-dua tarikh ini hanya
              muktamad selepas pengisytiharan rasmi Pejabat Mufti. Sepanjang bulan yang mulia ini, jangan lepaskan
              malam Nuzul Al-Quran pada 17 Ramadan dan sepuluh malam terakhir — masa yang paling afdal untuk
              beriktikaf, bertadarus dan mencari Lailatul Qadar di masjid berdekatan.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Waktu sahur dan berbuka</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Waktu imsak dan berbuka di Singapura berubah sedikit demi sedikit setiap hari. Kebiasaannya waktu Subuh
              masuk sekitar jam 5.45 pagi dan waktu Maghrib sekitar 7.15 hingga 7.30 malam, tetapi jangan main agak —
              semak jadual harian di halaman{" "}
              <Link className="link-inline" href="/waktu-solat-singapore">waktu solat Singapura</Link> kami sebelum
              bersahur dan berbuka. Amalan sunnah: lewatkan sedikit sahur, segerakan berbuka, dan mulakan dengan kurma
              serta air sebelum solat Maghrib.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Bazar Ramadan dan juadah berbuka</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Bazar Ramadan <strong>Geylang Serai</strong> kekal menjadi tumpuan utama setiap tahun — dari Raya kuih
              tradisional, ayam percik dan vadai sehinggalah pelbagai jajanan moden. Bazar-bazar kejiranan turut
              bermunculan di Tampines, Woodlands, Jurong dan kawasan lain. Untuk berbuka bersama keluarga, ramai yang
              memilih restoran halal dengan hidangan buffet atau set berbuka — layari{" "}
              <Link className="link-inline" href="/iftar-buka-puasa-singapore">senarai tempat iftar &amp; buka puasa</Link>{" "}
              atau <Link className="link-inline" href="/explore">terokai direktori halal kami</Link> untuk pilihan yang
              disahkan sijil halal MUIS atau milik orang Islam.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Terawih dan ibadah di masjid</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Sekitar 70 buah masjid di seluruh Singapura mengadakan solat terawih berjemaah setiap malam, kebanyakannya
              disusuli dengan tazkirah ringkas dan moreh. Saf biasanya cepat penuh pada malam-malam awal Ramadan dan
              sepuluh malam terakhir, jadi datanglah awal dan bawa sejadah sendiri. Cari masjid yang berdekatan dengan
              anda di <Link className="link-inline" href="/mosques">direktori masjid Singapura</Link>. Bagi yang bermusafir
              atau berbuka di luar, <Link className="link-inline" href="/tools/qibla">penunjuk arah kiblat</Link> kami
              boleh membantu di mana sahaja anda berada.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Zakat fitrah dan persiapan Raya</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Jangan lupa menunaikan zakat fitrah sebelum solat sunat Aidilfitri — kadarnya diumumkan oleh MUIS setiap
              tahun dan boleh dibayar di masjid atau secara dalam talian. Bagi zakat harta, gunakan{" "}
              <Link className="link-inline" href="/tools/zakat">kalkulator zakat</Link> kami sebagai panduan awal.
              Menjelang penghujung Ramadan, mulakan persiapan Raya — baju kurung, kuih raya dan juadah rumah terbuka —
              dengan <Link className="link-inline" href="/ms/hari-raya">panduan Hari Raya 2026</Link> kami.
            </p>
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Rancang Ramadan anda</h2>
          <div className="hub-grid">
            <Link href="/waktu-solat-singapore" className="hub-link"><span>Waktu solat &amp; berbuka harian</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/iftar-buka-puasa-singapore" className="hub-link"><span>Tempat iftar &amp; buka puasa</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/mosques" className="hub-link"><span>Masjid untuk terawih</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/tools/qibla" className="hub-link"><span>Penunjuk arah kiblat</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/ms/hari-raya" className="hub-link"><span>Panduan Hari Raya 2026</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/ramadan" className="hub-link"><span lang="en">Ramadan guide in English</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <section className="newsletter-card mt24" style={{ maxWidth: 640 }}>
            <span className="eyebrow" style={{ color: "var(--emerald)" }}>🌙 Percuma — Perancang Ramadan 2026</span>
            <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Dapatkan Perancang Ramadan 2026</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Jadual puasa 30 hari, senarai tempat berbuka, waktu sahur &amp; iftar dan senarai semak zakat — terus ke
              e-mel anda, bersama panduan halal mingguan kami untuk Singapura.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="ms-ramadan" cta="Hantar perancang" />
            </div>
          </section>

          <div className="seo-prose mt24" style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 12px" }}>Soalan lazim</h2>
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item" name="ms-ramadan-faq">
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
