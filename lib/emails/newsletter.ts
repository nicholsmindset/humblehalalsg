/* Immediate resource delivery for every newsletter capture surface.
   Beehiiv owns subscribers and broadcasts; Resend fulfils the exact promise
   made by the form (guide, checklist, starter kit, or relevant welcome). */
import { SITE } from "@/lib/seo";
import { emailLayout, esc, p, type EmailCTA } from "./layout";

const U = SITE.url;
const first = (name?: string | null) => (name ? esc(String(name).trim().split(/\s+/)[0]) : "there");
const greet = (name?: string | null, fallback = "there") => p(`Assalamualaikum ${name ? first(name) : fallback},`);
const list = (items: string[]) =>
  `<ul style="margin:0 0 18px;padding-left:22px;color:#1c2621;">${items.map((item) => `<li style="margin:0 0 9px;font-size:15px;line-height:1.55;">${item}</li>`).join("")}</ul>`;

export type NewsletterSignupEmail = { subject: string; html: string; template: string };

function wrap(
  template: string,
  subject: string,
  heading: string,
  bodyHtml: string,
  cta: EmailCTA,
  footerNote?: string,
): NewsletterSignupEmail {
  return {
    template,
    subject,
    html: emailLayout({ preheader: subject, heading, bodyHtml, cta, footerNote }),
  };
}

const WEEKEND_PLANNER_URL = `${U}/guides/halal-weekend-planner-singapore.pdf`;

function weekendPlanner(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-weekend-planner",
    "Your 10-Minute Halal Weekend Planner",
    "Your weekend plan starts here",
    greet(name) +
      p("Jazakallah khair for joining Humble Halal. Your four-page planner helps you choose one area, one main meal, one prayer stop and one meaningful activity—without turning the weekend into a research project.") +
      p("Use the printable worksheet now. Then, each Friday, we’ll send one short email with current Singapore finds and ideas to help you fill it."),
    { label: "Open the 10-Minute Weekend Planner", url: WEEKEND_PLANNER_URL },
    "Humble Halal is a discovery platform, not a certifier. Always verify current details before visiting.",
  );
}

function guideHub(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-weekend-planner",
    "Your 10-Minute Halal Weekend Planner",
    "Your reusable weekend planner",
    greet(name) +
      p("Your planner gives you a simple method, a printable worksheet and a quick halal-status check you can reuse year-round.") +
      p("We’ll also send one useful Friday email with current Singapore finds and planning ideas."),
    { label: "Open the 10-Minute Weekend Planner", url: WEEKEND_PLANNER_URL },
  );
}

function certificationEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-certification-updates",
    "Welcome to Humble Halal certification updates",
    "Halal status changes, made easier to follow",
    greet(name) +
      p("You’re on the list for useful updates from our records, including new certifications, renewals, lapses and newly listed halal places in Singapore.") +
      p("Humble Halal is a discovery platform, not a certifier. Always make your final check on the official MUIS HalalSG register."),
    { label: "See recent certification changes", url: `${U}/halal-certification-changes` },
  );
}

function hawkerEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-hawker",
    "Your weekly halal hawker guide starts here",
    "More halal hawker finds around Singapore",
    greet(name) +
      p("We’ll share new halal stalls, hawker-centre updates and practical food finds in the weekly Humble Halal guide.") +
      p("Start with our live hawker guide, organised by centre and location."),
    { label: "Explore halal hawker centres", url: `${U}/hawker` },
    "Always verify current certification on the official MUIS HalalSG register before visiting.",
  );
}

function eventsEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-events",
    "Your weekly halal events guide starts here",
    "Bazaars, classes and community events",
    greet(name) +
      p("You’re on the list for Muslim-friendly event updates around Singapore, including bazaars, learning circles, family activities and community gatherings.") +
      p("The live events page is the best place to check current dates, venues, ticket details and availability."),
    { label: "Browse upcoming events", url: `${U}/events` },
  );
}

function travelEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-travel",
    "Your halal-friendly travel checklist",
    "Plan your trip with confidence",
    greet(name) + p("Here’s the halal-friendly travel checklist we promised:") +
      list([
        "Save prayer times and the Qibla direction for your destination before departure.",
        "Map nearby mosques and prayer spaces around your hotel and main attractions.",
        "Check halal certification directly with the restaurant or local authority—labels vary by country.",
        "Pack a compact prayer mat, prayer garments and a universal power adapter.",
        "Keep key dietary phrases and emergency contacts available offline.",
        "Compare the full hotel or flight price, cancellation rules and location before booking.",
      ]) +
      p("Use Humble Halal Travel for Muslim-friendly hotel discovery, city planning and price tools."),
    { label: "Open Humble Halal Travel", url: `${U}/travel` },
    "Travel information and prices can change—confirm details directly before booking.",
  );
}

function ramadanEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-weekend-planner",
    "Your year-round Halal Weekend Planner",
    "Keep planning simply, beyond the season",
    greet(name) +
      p("Ramadan changes each year, so we now keep seasonal information on the live site. This reusable planner helps you plan one meal, one prayer stop and one meaningful activity in ten minutes.") +
      p("We’ll send timely Ramadan resources again when the season returns, insyaAllah."),
    { label: "Open the 10-Minute Weekend Planner", url: WEEKEND_PLANNER_URL },
    "Always confirm current prayer times and halal details using official sources.",
  );
}

function rayaEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-hari-raya-checklist",
    "Your Hari Raya planning checklist",
    "A calmer Hari Raya starts here",
    greet(name) + p("Here’s your practical Hari Raya checklist:") +
      list([
        "Confirm visiting dates, guest numbers and the family schedule.",
        "Book halal catering or plan the menu, serving ware and food storage.",
        "Complete baju, tailoring and laundry early—including outfits for children.",
        "Prepare green packets, gifts and a simple household budget.",
        "Plan the pre-Raya clean-up, decorations and a prayer-friendly guest space.",
        "Check transport, parking and accessibility for older relatives.",
      ]) +
      p("Revisit the Humble Halal Hari Raya hub for local planning ideas and halal businesses."),
    { label: "Open the Hari Raya hub", url: `${U}/hari-raya` },
  );
}

function ownerEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-owner-starter-kit",
    "Your Humble Halal business starter kit",
    "Help more halal-seekers find you",
    greet(name) + p("Here’s the starter kit for a stronger Humble Halal listing:") +
      list([
        "Claim or create your listing so you control its details.",
        "Add a clear halal status and your current MUIS certificate when applicable.",
        "Complete your hours, contact details, menus and service information.",
        "Upload bright, recent photos of the storefront, products and atmosphere.",
        "Ask genuine customers for reviews and reply to feedback professionally.",
      ]) +
      p("A complete, current listing builds trust and gives customers more reasons to visit or enquire."),
    { label: "Start with your business listing", url: `${U}/for-business` },
  );
}

function advertiseEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-advertising-kit",
    "Humble Halal advertising formats and current rates",
    "Reach Singapore’s halal-conscious community",
    greet(name) + p("Thanks for your interest. Our current starting rates are:") +
      list([
        "Featured Listing — from S$49/month",
        "Homepage Spotlight — from S$450/month",
        "Category Sponsorship — from S$300/month",
        "Newsletter Sponsorship — from S$250/send",
        "Event Promotion — from S$120/event",
        "Sponsored Content — custom quotation",
      ]) +
      p("Reply with your goals, timing and budget and we’ll recommend the best format."),
    { label: "View advertising options", url: `${U}/advertise` },
    "Rates and availability may change; your written quotation will confirm final pricing.",
  );
}

function prayerEmail(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-prayer-times",
    "Your Singapore prayer-times guide",
    "Keep today’s prayer times close",
    greet(name) +
      p("Use the live prayer-times guide for today’s Singapore timings, the next prayer and nearby mosque information.") +
      p("We’ll also send one useful weekly email with prayer guides, community events and halal finds."),
    { label: "View Singapore prayer times", url: `${U}/waktu-solat-singapore` },
    "Timings can vary by location and calculation method; confirm official Singapore timings with MUIS.",
  );
}

function toolEmail(slug: string, name?: string | null): NewsletterSignupEmail {
  if (slug === "ramadan") return ramadanEmail(name);
  if (slug === "prayer-times") return prayerEmail(name);
  if (slug === "zakat") {
    return wrap(
      "newsletter-tool-zakat",
      "Your Zakat calculation checklist",
      "Work through your Zakat estimate",
      greet(name) + p("Use this four-step checklist before opening the calculator:") +
        list([
          "List cash, savings, gold, investments and eligible business assets.",
          "Deduct eligible short-term debts and liabilities.",
          "Compare the net amount with the current nisab threshold.",
          "If it is above nisab and the conditions are met, calculate 2.5%.",
        ]) +
        p("Use this as an educational starting point and verify complex cases with a qualified scholar or trusted Zakat authority."),
      { label: "Open the Zakat calculator", url: `${U}/tools/zakat` },
    );
  }
  if (slug === "inheritance") {
    return wrap(
      "newsletter-tool-inheritance",
      "Your plain-English Faraid starting guide",
      "Understanding the first steps of Faraid",
      greet(name) +
        p("Start by listing the estate, settling funeral costs and debts, and applying any valid wasiyyah before calculating heirs’ shares. Spouses, parents and children can have fixed Qur’anic shares, with the balance handled under the applicable Faraid rules.") +
        p("Every surviving relative can change the outcome. Use the calculator for education only and have the final distribution checked by a qualified scholar or legal professional."),
      { label: "Open the Faraid calculator", url: `${U}/tools/inheritance` },
    );
  }
  if (slug === "halal-stocks") {
    return wrap(
      "newsletter-tool-halal-stocks",
      "Your halal stock-screening checklist",
      "Four checks before considering a stock",
      greet(name) + list([
        "Review the company’s core business activities and excluded sectors.",
        "Check interest-bearing debt and interest income against the screening standard you follow.",
        "Review non-permissible income and any purification guidance.",
        "Re-screen regularly because company financials and index classifications change.",
      ]) + p("The tool is educational information, not financial advice or a recommendation to buy or sell any security."),
      { label: "Open the halal stocks screener", url: `${U}/tools/halal-stocks` },
    );
  }
  if (slug === "ingredient-checker") {
    return wrap(
      "newsletter-tool-ingredient-checker",
      "Your halal ingredient-checking guide",
      "Check labels with more confidence",
      greet(name) +
        p("Search unfamiliar ingredient names or E-numbers, then confirm the finished product’s certification and manufacturing context. A single ingredient result does not certify the whole product.") +
        p("For current certification details, use the official MUIS HalalSG search and check the exact outlet."),
      { label: "Open the ingredient checker", url: `${U}/tools/ingredient-checker` },
    );
  }
  return wrap(
    "newsletter-tools",
    "More free tools for Muslim life in Singapore",
    "Your Humble Halal tools hub",
    greet(name) +
      p("Humble Halal brings together practical Islamic tools, halal discovery, prayer resources and community guides for Singapore.") +
      p("Bookmark the tools hub and we’ll keep you updated when useful new resources are released."),
    { label: "Explore all free tools", url: `${U}/tools` },
  );
}

function malayFood(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-ms-weekend-planner",
    "Perancang hujung minggu halal 10 minit anda",
    "Rancang hujung minggu dengan lebih mudah",
    greet(name, "sahabat") +
      p("Perancang empat halaman ini membantu anda memilih satu kawasan, satu hidangan utama, satu tempat solat dan satu aktiviti bermakna.") +
      p("Anda juga akan menerima satu e-mel ringkas setiap Jumaat dengan idea semasa di Singapura."),
    { label: "Buka perancang hujung minggu", url: WEEKEND_PLANNER_URL },
    "Sentiasa semak butiran dan status pensijilan semasa sebelum berkunjung.",
  );
}

function malayMosque(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-ms-mosque",
    "Selamat datang ke panduan komuniti Muslim Singapura",
    "Berita masjid, komuniti dan makanan halal",
    greet(name, "sahabat") +
      p("Anda kini dalam senarai untuk panduan mingguan Humble Halal—termasuk program masjid, acara komuniti, tempat makan halal baharu dan panduan keluarga.") +
      p("Mulakan dengan direktori masjid Singapura kami."),
    { label: "Lihat masjid di Singapura", url: `${U}/mosques` },
  );
}

function malayRamadan(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-ms-weekend-planner",
    "Perancang hujung minggu halal anda",
    "Panduan yang boleh digunakan sepanjang tahun",
    greet(name, "sahabat") +
      p("Maklumat Ramadan berubah setiap tahun, jadi panduan bermusim kini disimpan di laman langsung kami. Perancang ini membantu anda memilih makanan, tempat solat dan aktiviti dalam sepuluh minit.") +
      p("Kami akan menghantar sumber Ramadan yang tepat pada masanya apabila musimnya tiba, insya-Allah."),
    { label: "Buka perancang hujung minggu", url: WEEKEND_PLANNER_URL },
    "Sila sahkan waktu solat dan butiran halal semasa melalui sumber rasmi.",
  );
}

function malayRaya(name?: string | null): NewsletterSignupEmail {
  return wrap(
    "newsletter-ms-hari-raya",
    "Senarai semak persiapan Hari Raya anda",
    "Persiapan Raya yang lebih teratur",
    greet(name, "sahabat") + p("Berikut ialah senarai semak praktikal anda:") +
      list([
        "Sahkan tarikh kunjungan, jumlah tetamu dan jadual keluarga.",
        "Tempah katering halal atau rancang menu, perkakas hidangan dan penyimpanan makanan.",
        "Siapkan baju, jahitan dan dobi lebih awal—termasuk pakaian kanak-kanak.",
        "Sediakan sampul hijau, hadiah dan bajet rumah yang ringkas.",
        "Rancang pembersihan, hiasan dan ruang mesra solat untuk tetamu.",
        "Semak pengangkutan, tempat letak kereta dan akses untuk warga emas.",
      ]),
    { label: "Buka panduan Hari Raya", url: `${U}/ms/hari-raya` },
  );
}

/** Select the exact immediate email promised by the capture surface. */
export function newsletterSignupEmail(o: { source?: string | null; name?: string | null }): NewsletterSignupEmail {
  const source = String(o.source || "newsletter").trim().toLowerCase();
  if (source === "ms-ramadan") return malayRamadan(o.name);
  if (source === "ms-hari-raya") return malayRaya(o.name);
  if (source === "ms-masjid") return malayMosque(o.name);
  if (source.startsWith("ms-")) return malayFood(o.name);
  if (source === "advertise") return advertiseEmail(o.name);
  if (source === "for-business") return ownerEmail(o.name);
  if (source === "travel" || source.startsWith("travel:") || source.startsWith("hotel") || source.startsWith("flight")) return travelEmail(o.name);
  if (source === "events" || source.startsWith("event")) return eventsEmail(o.name);
  if (source === "ramadan") return ramadanEmail(o.name);
  if (source === "hari-raya") return rayaEmail(o.name);
  if (source === "guides") return guideHub(o.name);
  if (source === "waktu-solat-hub") return prayerEmail(o.name);
  if (source === "hawker" || source === "hawker-centre") return hawkerEmail(o.name);
  if (source === "cert-changes" || source.startsWith("is-halal")) return certificationEmail(o.name);
  if (source.startsWith("tool:")) return toolEmail(source.slice(5), o.name);
  return weekendPlanner(o.name);
}
