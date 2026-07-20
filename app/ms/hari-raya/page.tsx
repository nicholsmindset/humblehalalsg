import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

/* Malay-language pair of /hari-raya (hreflang-lite; see lib/ms-pages.ts).
   Original Bahasa Melayu prose for Malay-first searches ("bila Hari Raya 2026",
   "persiapan raya Singapura") — not a literal translation. */

export const metadata: Metadata = pageMeta({
  title: "Hari Raya 2026 Singapura — Tarikh, Bazar & Persiapan Raya",
  description:
    "Bila Hari Raya 2026? Aidilfitri dijangka sekitar 20 Mac 2026 dan Aidiladha sekitar 27 Mei 2026. Panduan persiapan Raya di Singapura — solat sunat, baju, kuih, katering dan rumah terbuka.",
  path: "/ms/hari-raya",
  absoluteTitle: true,
  languages: {
    "en-SG": "/hari-raya",
    ms: "/ms/hari-raya",
    "x-default": "/hari-raya",
  },
});

const FAQ = [
  { q: "Bila Hari Raya Aidilfitri 2026 di Singapura?", a: "Hari Raya Aidilfitri 2026 dijangka jatuh pada atau sekitar 20 Mac 2026, menandakan berakhirnya Ramadan. Tarikh muktamad hanya selepas rukyah anak bulan Syawal disahkan oleh Pejabat Mufti (MUIS). Hari Raya Puasa ialah cuti umum di Singapura." },
  { q: "Bila Hari Raya Haji 2026?", a: "Hari Raya Haji (Aidiladha) 2026 dijangka jatuh pada atau sekitar 27 Mei 2026, tertakluk kepada rukyah anak bulan Zulhijjah. Ia turut menjadi cuti umum di Singapura, dan ibadah korban dijalankan di masjid-masjid yang mengendalikannya." },
  { q: "Pukul berapa solat sunat Hari Raya?", a: "Solat sunat Aidilfitri biasanya diadakan pada awal pagi, dengan kebanyakan masjid di Singapura mengadakan satu atau dua sesi bermula sekitar jam 7.30 hingga 8.30 pagi. Waktu berbeza mengikut masjid — semak pengumuman masjid kariah anda dan datang awal kerana saf cepat penuh." },
  { q: "Bila bazar Hari Raya Geylang Serai bermula?", a: "Bazar Hari Raya Geylang Serai dan bazar-bazar kejiranan biasanya beroperasi sepanjang bulan Ramadan, pada minggu-minggu menjelang Aidilfitri — semakin hampir Raya, semakin meriah dan semakin ramai pengunjungnya." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Laman Utama", path: "/" },
            { name: "Hari Raya 2026", path: "/ms/hari-raya" },
          ]),
        ]}
      />
      <div className="screen-in hh-page" lang="ms">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Laman Utama</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Hari Raya 2026</span>
            </nav>
            <span className="eyebrow">Panduan Raya</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Hari Raya 2026 di Singapura</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>Hari Raya Aidilfitri 2026 dijangka jatuh sekitar 20 Mac 2026</strong>, tertakluk kepada rukyah anak
              bulan yang disahkan oleh MUIS. Dari solat sunat pagi Raya hingga ke rumah terbuka — ini panduan persiapan
              Raya untuk keluarga di Singapura.
            </p>
            <p className="faint" style={{ marginTop: 12, fontSize: ".92rem" }}>
              <Link className="link-inline" href="/hari-raya" lang="en">View this guide in English →</Link>
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="seo-prose" style={{ maxWidth: 720, marginInline: "auto" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Tarikh Hari Raya 2026</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              <strong>Hari Raya Aidilfitri</strong> (Hari Raya Puasa) dijangka pada sekitar <strong>20 Mac 2026</strong>,
              manakala <strong>Hari Raya Haji</strong> (Aidiladha) dijangka sekitar <strong>27 Mei 2026</strong> —
              kedua-duanya cuti umum di Singapura dan muktamad hanya selepas pengisytiharan rasmi Pejabat Mufti. Malam
              Raya dimeriahkan dengan takbir yang berkumandang dari masjid-masjid dan rumah-rumah, sebelum umat Islam
              berhimpun untuk solat sunat Aidilfitri keesokan paginya.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Solat sunat Aidilfitri</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Kebanyakan masjid di Singapura mengadakan satu atau dua sesi solat sunat Aidilfitri pada awal pagi Raya,
              biasanya bermula antara jam 7.30 hingga 8.30 pagi. Saf cepat penuh — datang awal, dan sesetengah masjid
              menyediakan ruang tambahan atau dewan solat wanita. Semak masjid kariah anda melalui{" "}
              <Link className="link-inline" href="/mosques">direktori masjid Singapura</Link> dan pastikan waktu Subuh
              pagi Raya dengan <Link className="link-inline" href="/waktu-solat-singapore">jadual waktu solat</Link> kami.
              Jangan lupa: zakat fitrah perlu ditunaikan sebelum solat sunat Aidilfitri.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Persiapan Raya — baju, kuih dan juadah</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Persiapan Raya bermula awal bagi kebanyakan keluarga: menempah baju kurung dan baju Melayu sedondon,
              memilih kuih raya — dari kuih makmur dan tart nanas hinggalah kuih lapis — serta merancang juadah rumah
              terbuka. Ketupat, rendang, sambal goreng dan lontong tetap menjadi menu wajib. Kalau tahun ini anda
              memilih untuk menempah, ada banyak pilihan katering halal di Singapura — lihat{" "}
              <Link className="link-inline" href="/hari-raya-catering-singapore">senarai katering Hari Raya</Link> atau{" "}
              <Link className="link-inline" href="/explore">terokai perniagaan halal dan milik orang Islam</Link> di
              direktori kami, dari pembuat kuih rumahan hingga katering bersijil halal MUIS.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Ziarah, rumah terbuka dan duit raya</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Pagi Raya dimulakan dengan bermaaf-maafan bersama keluarga sebelum menziarahi kubur dan kemudian beraya
              dari rumah ke rumah — amalan ziarah yang menjadi keistimewaan masyarakat Melayu Singapura sepanjang bulan
              Syawal. Sediakan sampul hijau untuk duit raya anak-anak dan ibu bapa, dan hulurkan seikhlas hati; yang
              penting silaturahim, bukan jumlahnya. Bagi yang menganjurkan rumah terbuka, rancang menu awal dan pastikan
              juadah yang ditempah datang daripada penyedia yang halal — gunakan{" "}
              <Link className="link-inline" href="/is-halal">semakan status halal</Link> kami jika kurang pasti tentang
              sesuatu jenama.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Bazar Raya Geylang Serai</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Sepanjang Ramadan hingga malam Raya, bazar Geylang Serai menjadi nadi persiapan — langsir dan perhiasan
              rumah, baju Raya saat akhir, kuih-muih dan lampu-lampu pelita. Pergilah pada hari bekerja jika mahu elak
              kesesakan hujung minggu. Sementara itu, ikuti <Link className="link-inline" href="/ms/ramadan">panduan
              Ramadan 2026</Link> kami untuk tarikh-tarikh penting sebelum tibanya Syawal.
            </p>
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px auto 14px", maxWidth: 720 }}>Bersiap untuk Raya</h2>
          <div className="hub-grid" style={{ maxWidth: 720, marginInline: "auto" }}>
            <Link href="/hari-raya-catering-singapore" className="hub-link"><span>Katering &amp; buffet Hari Raya</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/mosques" className="hub-link"><span>Masjid untuk solat sunat Raya</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/waktu-solat-singapore" className="hub-link"><span>Waktu solat Singapura</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/explore" className="hub-link"><span>Direktori perniagaan halal</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/ms/ramadan" className="hub-link"><span>Panduan Ramadan 2026</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/hari-raya" className="hub-link"><span lang="en">Hari Raya guide in English</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <section className="newsletter-card mt24" style={{ maxWidth: 640, marginInline: "auto" }}>
            <span className="eyebrow" style={{ color: "var(--emerald)" }}>🌙 Percuma — Senarai semak Raya</span>
            <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Dapatkan senarai semak persiapan Hari Raya 2026</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Katering, baju, persiapan rumah terbuka dan kira detik Raya — terus ke e-mel anda, bersama panduan halal
              mingguan kami untuk Singapura.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="ms-hari-raya" cta="Hantar senarai semak" />
            </div>
          </section>

          <div className="seo-prose mt24" style={{ maxWidth: 720, marginInline: "auto" }}>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 12px" }}>Soalan lazim</h2>
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item" name="ms-raya-faq">
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
