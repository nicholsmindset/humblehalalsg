import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

/* Malay-language pair of /mosques (hreflang-lite; see lib/ms-pages.ts).
   Original Bahasa Melayu prose for Malay-first searches ("senarai masjid di
   Singapura", "masjid berdekatan") — not a literal translation. */

export const metadata: Metadata = pageMeta({
  title: "Senarai Masjid di Singapura — Alamat, Waktu Solat & Jumaat",
  description:
    "Senarai masjid di Singapura mengikut wilayah — Tengah, Timur, Timur Laut, Utara dan Barat. Cari masjid berdekatan anda, waktu solat Jumaat, arah kiblat dan kemudahan setiap masjid.",
  path: "/ms/masjid-singapura",
  absoluteTitle: true,
  languages: {
    "en-SG": "/mosques",
    ms: "/ms/masjid-singapura",
    "x-default": "/mosques",
  },
});

const FAQ = [
  { q: "Berapa buah masjid ada di Singapura?", a: "Terdapat sekitar 70 buah masjid di seluruh Singapura di bawah pentadbiran MUIS — daripada masjid bersejarah seperti Masjid Sultan dan Masjid Hajjah Fatimah hinggalah masjid-masjid baharu di estet perumahan seperti Masjid Yusof Ishak dan Masjid Maarof. Senarai penuh mengikut wilayah ada di direktori masjid kami." },
  { q: "Pukul berapa solat Jumaat di masjid Singapura?", a: "Waktu Zuhur pada hari Jumaat di Singapura biasanya masuk sekitar jam 1 tengah hari, dan khutbah bermula tidak lama selepas itu. Sesetengah masjid yang besar mengadakan dua sesi. Datang awal kerana saf cepat penuh — semak halaman masjid masing-masing untuk butiran sesi." },
  { q: "Bagaimana nak cari masjid paling dekat dengan saya?", a: "Gunakan peta interaktif kami yang menunjukkan semua masjid di Singapura mengikut lokasi anda, atau layari direktori masjid yang disusun mengikut wilayah Tengah, Timur, Timur Laut, Utara dan Barat, lengkap dengan alamat dan arah perjalanan." },
  { q: "Di mana boleh solat jika tiada masjid berdekatan?", a: "Selain masjid, terdapat banyak bilik solat (musolla) di pusat beli-belah, stesen MRT, lapangan terbang dan bangunan pejabat di seluruh Singapura. Lihat panduan bilik solat kami untuk senarai lokasi dan kemudahan wudhu." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Laman Utama", path: "/" },
            { name: "Masjid di Singapura", path: "/ms/masjid-singapura" },
          ]),
        ]}
      />
      <div className="screen-in hh-page" lang="ms">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Laman Utama</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Masjid di Singapura</span>
            </nav>
            <span className="eyebrow">Carian masjid</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Senarai Masjid di Singapura</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>Sekitar 70 buah masjid di seluruh Singapura</strong>, disusun mengikut wilayah — Tengah, Timur,
              Timur Laut, Utara dan Barat. Cari masjid yang berdekatan dengan anda, dapatkan arah perjalanan, waktu
              solat Jumaat dan kemudahan setiap masjid.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link href="/mosques" className="btn btn-primary">Buka direktori penuh masjid →</Link>
            </div>
            <p className="faint" style={{ marginTop: 12, fontSize: ".92rem" }}>
              <Link className="link-inline" href="/mosques" lang="en">View this page in English →</Link>
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="seo-prose" style={{ maxWidth: 720, marginInline: "auto" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Masjid mengikut wilayah</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Masjid-masjid di Singapura tersebar di setiap penjuru pulau, daripada masjid warisan di kawasan bandar
              seperti <strong>Masjid Sultan</strong> di Kampong Glam dan <strong>Masjid Abdul Gafoor</strong> di Little
              India, hinggalah masjid-masjid moden di estet HDB seperti Masjid Yusof Ishak di Woodlands dan Masjid
              Maarof di Jurong. Di <Link className="link-inline" href="/mosques">direktori masjid</Link> kami, setiap
              masjid disenaraikan mengikut wilayah — Tengah, Timur, Timur Laut, Utara dan Barat — dengan alamat penuh,
              pautan arah perjalanan dan halaman profil untuk masjid-masjid utama. Anda juga boleh membuka{" "}
              <Link className="link-inline" href="/map?show=mosques">peta interaktif</Link> untuk melihat masjid yang
              paling hampir dengan lokasi anda.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Waktu solat dan solat Jumaat</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Waktu solat di Singapura berdasarkan takwim yang dikeluarkan oleh MUIS dan berubah sedikit setiap hari —
              semak jadual harian Subuh, Zuhur, Asar, Maghrib dan Isyak di halaman{" "}
              <Link className="link-inline" href="/waktu-solat-singapore">waktu solat Singapura</Link> kami. Pada hari
              Jumaat, kebanyakan masjid mula dipenuhi jemaah dari jam 12.30 tengah hari; masjid-masjid besar seperti
              Masjid Sultan dan masjid di kawasan pejabat sering mengadakan lebih daripada satu sesi. Bagi yang berada
              di luar rumah, <Link className="link-inline" href="/tools/qibla">penunjuk arah kiblat</Link> kami membantu
              anda menghadap kiblat dengan tepat di mana sahaja.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Kemudahan di masjid</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Kebanyakan masjid di Singapura menyediakan ruang solat wanita, kemudahan wudhu yang selesa, dan akses
              untuk warga emas serta pengguna kerusi roda — masjid-masjid yang lebih baharu turut dilengkapi lif dan
              ruang letak kereta. Selain solat fardu lima waktu dan solat Jumaat, masjid menjadi pusat kegiatan umat
              Islam: kelas mengaji dan madrasah hujung minggu, ceramah agama, program remaja dan aktiviti kariah.
              Butiran kemudahan setiap masjid ada di halaman profilnya dalam direktori kami.
            </p>

            <h2 style={{ fontSize: "1.4rem", margin: "26px 0 12px" }}>Musolla dan bilik solat di luar masjid</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Sedang membeli-belah atau dalam perjalanan dan tiada masjid berdekatan? Singapura mempunyai rangkaian
              bilik solat (musolla) yang luas — di pusat beli-belah seperti VivoCity dan Jewel Changi, di hospital,
              dan di beberapa bangunan pejabat. Lihat panduan{" "}
              <Link className="link-inline" href="/prayer-rooms">bilik solat di Singapura</Link> untuk senarai penuh.
              Selepas solat, <Link className="link-inline" href="/explore">terokai restoran dan perniagaan halal</Link>{" "}
              yang berhampiran di direktori kami.
            </p>
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px auto 14px", maxWidth: 720 }}>Panduan berkaitan</h2>
          <div className="hub-grid" style={{ maxWidth: 720, marginInline: "auto" }}>
            <Link href="/waktu-solat-singapore" className="hub-link"><span>Waktu solat Singapura hari ini</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/tools/qibla" className="hub-link"><span>Penunjuk arah kiblat</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/prayer-rooms" className="hub-link"><span>Bilik solat &amp; musolla</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/map?show=mosques" className="hub-link"><span>Peta masjid berdekatan anda</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/ms/ramadan" className="hub-link"><span>Panduan Ramadan 2026</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/mosques" className="hub-link"><span lang="en">Full mosque directory in English</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <section className="newsletter-card mt24" style={{ maxWidth: 640, marginInline: "auto" }}>
            <span className="eyebrow" style={{ color: "var(--emerald)" }}>🕌 Panduan halal mingguan</span>
            <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Ikuti berita komuniti Muslim Singapura</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Tempat makan halal baharu, program masjid dan panduan bermanfaat untuk keluarga — sekali seminggu, terus
              ke e-mel anda.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="ms-masjid" cta="Langgan" />
            </div>
          </section>

          <div className="seo-prose mt24" style={{ maxWidth: 720, marginInline: "auto" }}>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 12px" }}>Soalan lazim</h2>
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item" name="ms-masjid-faq">
                <summary>{f.q}<span className="faq-chevron" aria-hidden="true" /></summary>
                <p className="muted" style={{ padding: "8px 0" }}>{f.a}</p>
              </details>
            ))}
            <p className="faint" style={{ fontSize: ".84rem", marginTop: 16 }}>
              Sentiasa sahkan waktu solat dan butiran program dengan pihak masjid atau melalui direktori rasmi masjid
              MUIS. Sumber: maklumat komuniti dan awam.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
