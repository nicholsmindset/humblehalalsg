/* Humble Halal — legal/compliance page content (Singapore PDPA-aware).
   NOTE: This is a good-faith template tailored to the platform's actual data
   flows. Have it reviewed by a qualified adviser before relying on it. */

export interface LegalSection {
  h2: string;
  body?: string[];
  bullets?: string[];
}
export interface LegalDoc {
  slug: string;
  title: string;
  updated: string; // human-readable
  intro: string;
  caveat?: string;
  sections: LegalSection[];
}

import { CONTACT_EMAILS } from "./contact";

const OPERATOR = "ONN GROUP LLP";
const ADDRESS = "60 Paya Lebar Road, #06-28 Paya Lebar Square, Singapore 409051";
const PRIVACY_EMAIL = CONTACT_EMAILS.privacy;
// "Last updated" shown on every legal page — bump this whenever any legal doc's
// wording changes (it won't auto-update).
const UPDATED = "13 June 2026";
const CAVEAT = "This is a plain-language summary written in good faith and tailored to how the platform actually works. It is not legal advice — please have it reviewed by a qualified lawyer before relying on it.";

export const legalDocs: Record<string, LegalDoc> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    updated: UPDATED,
    intro: `Humble Halal is operated by ${OPERATOR} (“we”, “us”). This policy explains what personal data we collect, why, and your rights under Singapore's Personal Data Protection Act (PDPA).`,
    caveat: CAVEAT,
    sections: [
      {
        h2: "What we collect",
        bullets: [
          "Email address — when you subscribe to the halal guide newsletter.",
          "Name, email and phone — when you request a quote, suggest or claim a business, or contact us.",
          "Reviews and the display name you provide — when you post a review.",
          "Approximate location — only when you tap “near me” and grant permission; used in your browser to sort results and not stored on our servers.",
          "Usage preferences — saved places, filters and settings are stored locally in your browser (localStorage), not on our servers, unless you create an account.",
        ],
      },
      {
        h2: "How we use it",
        bullets: [
          "To run the directory: show listings, sort by distance, save favourites.",
          "To send the newsletter you asked for (you can unsubscribe any time).",
          "To process business submissions, claims and quote requests.",
          "To moderate reviews and keep the platform safe and accurate.",
          "We do not sell your personal data.",
        ],
      },
      {
        h2: "Travel bookings",
        body: [
          "When you book a hotel or flight, the booking and payment are handled by our travel partner LiteAPI (Nuitée), which acts as the merchant of record. The traveller and contact details you enter (name, email, phone, and for flights the passenger/document details required by the airline) are passed to LiteAPI and on to the relevant hotel or airline to fulfil and confirm your booking.",
        ],
      },
      {
        h2: "Who we share it with",
        body: [
          "We use trusted service providers (data intermediaries) only to the extent needed to operate the service. Each receives only the data required for its purpose:",
        ],
        bullets: [
          "MailerLite — newsletter delivery (email address).",
          "Resend — transactional email such as booking, contact and alert emails (email address + message content).",
          "Stripe — payment processing for our own paid plans, advertising and event tickets (only if you make such a transaction).",
          "LiteAPI (Nuitée) — hotel and flight search, booking and payment as merchant of record (traveller, contact and passenger details).",
          "Supabase — database and storage (when account features are enabled).",
          "Vercel — website hosting.",
          "OneMap (Singapore Land Authority) — address lookup; OpenStreetMap — map tiles.",
        ],
      },
      {
        h2: "International transfers",
        body: [
          "Some of these providers process data outside Singapore (for example in the EU, UK or US). Where personal data is transferred overseas, we take reasonable steps so the recipient provides a standard of protection comparable to the PDPA, including through the provider's own contractual data-protection terms.",
        ],
      },
      {
        h2: "Cookies & local storage",
        body: [
          "We use minimal browser storage to remember your preferences and saved places, and a small record of your cookie-consent choice. See our Cookie Policy for details.",
        ],
      },
      {
        h2: "Your PDPA rights",
        bullets: [
          "Access — request a copy of the personal data we hold about you.",
          "Correction — ask us to correct inaccurate data.",
          "Withdraw consent — opt out of the newsletter or other processing at any time.",
          `Contact our data protection contact at ${PRIVACY_EMAIL} to exercise these rights.`,
        ],
      },
      {
        h2: "How long we keep it (retention)",
        body: [
          "We keep personal data only as long as needed for the purposes above or as required by law, then delete or anonymise it. As a guide:",
        ],
        bullets: [
          "Newsletter subscribers — until you unsubscribe, then removed at the next clean-up.",
          "Quote requests, business suggestions, claims and contact messages — up to about 12 months after they are resolved.",
          "Reviews — kept while published; on account deletion we remove or anonymise them.",
          "Booking records — kept as needed to support your trip and to meet tax/accounting obligations.",
        ],
      },
      {
        h2: "Security & data breaches",
        body: [
          "We apply reasonable technical and organisational security measures, but no system is perfectly secure. If a notifiable data breach occurs, we will assess it and notify the PDPC and affected individuals as required under the PDPA — in any case no later than 30 days after we determine the breach is notifiable.",
        ],
      },
      {
        h2: "Children, changes & contact",
        body: [
          "The service is not directed at children under 13. We may update this policy and will revise the date above. Questions or requests:",
          `${OPERATOR}, ${ADDRESS}. Email ${PRIVACY_EMAIL}.`,
        ],
      },
    ],
  },

  pdpa: {
    slug: "pdpa",
    title: "PDPA Notice",
    updated: UPDATED,
    intro: `This notice summarises how ${OPERATOR} complies with Singapore's Personal Data Protection Act (PDPA) when you use Humble Halal. It complements our full Privacy Policy.`,
    caveat: CAVEAT,
    sections: [
      {
        h2: "Consent & purpose limitation",
        body: [
          "We collect, use and disclose personal data only for the limited purposes you would reasonably expect, and we seek your consent where required. Those purposes are:",
        ],
        bullets: [
          "Running the directory and your saved places.",
          "Sending content and emails you asked for (newsletter, booking and contact emails, fare alerts).",
          "Processing business submissions, claims, quote requests and contact messages.",
          "Fulfilling hotel and flight bookings via our travel partner.",
          "Moderating reviews and keeping the platform safe and accurate.",
        ],
      },
      {
        h2: "Accuracy",
        body: [
          "We make reasonable efforts to keep the personal data we use accurate and complete, and you can ask us to correct it at any time (see below).",
        ],
      },
      {
        h2: "Access & correction",
        body: [
          `To request a copy of the personal data we hold about you, or to correct it, email ${PRIVACY_EMAIL} with enough detail for us to locate your records. We will respond as soon as practicable, and in any case within 30 days; if we cannot, we will tell you when we can.`,
        ],
      },
      {
        h2: "Withdrawing consent",
        body: [
          `You may withdraw consent at any time (for example, unsubscribe from the newsletter or email ${PRIVACY_EMAIL}). We will stop the relevant processing within a reasonable time; some records may be retained where the law requires.`,
        ],
      },
      {
        h2: "Do Not Call",
        body: [
          "We do not conduct telemarketing. We will not send marketing calls or texts to Singapore numbers registered with the Do Not Call (DNC) Registry without clear, separate consent.",
        ],
      },
      {
        h2: "Data protection contact",
        body: [
          `For access, correction or any PDPA query, contact our data protection contact: ${PRIVACY_EMAIL}, ${OPERATOR}, ${ADDRESS}. We aim to respond within 30 days.`,
        ],
      },
      {
        h2: "Data breaches",
        body: [
          "If a notifiable data breach occurs, we will assess and notify the PDPC and affected individuals as required under the PDPA's Data Breach Notification obligation, no later than 30 days after determining it is notifiable.",
        ],
      },
      {
        h2: "Complaints",
        body: [
          `If you're not satisfied with how we've handled your personal data, please contact us first at ${PRIVACY_EMAIL} so we can put it right. You also have the right to lodge a complaint with the Personal Data Protection Commission (PDPC) at pdpc.gov.sg.`,
        ],
      },
    ],
  },

  terms: {
    slug: "terms",
    title: "Terms of Service",
    updated: UPDATED,
    intro: `These terms govern your use of Humble Halal, operated by ${OPERATOR}. By using the site you agree to them.`,
    caveat: CAVEAT,
    sections: [
      {
        h2: "What Humble Halal is",
        body: [
          "Humble Halal is a discovery and directory platform for halal and Muslim-owned businesses in Singapore. We are NOT a halal certifier. We surface MUIS certification status and link to the official MUIS HalalSG register, but the authoritative source for halal certification is always MUIS. Always verify before you rely on it — see our Halal Disclaimer.",
        ],
      },
      {
        h2: "Listings & accuracy",
        body: [
          "Listing information (including hours, contact details and halal status) may be submitted by businesses or community members and can be out of date or incorrect. We make reasonable efforts to keep it accurate but do not guarantee it. Use the “Report incorrect info” link to flag issues.",
        ],
      },
      {
        h2: "Your content (reviews)",
        bullets: [
          "You must own or have the right to post what you submit, and it must be honest and lawful.",
          "No spam, hate speech, harassment, false claims, or content that infringes others' rights.",
          "Reviews are moderated and may be removed. You grant us a licence to display your submitted content on the platform.",
        ],
      },
      {
        h2: "Business listings & claims",
        body: [
          "Business owners may submit, claim and manage listings. By doing so you confirm you are authorised to represent the business and that the information is accurate. We may verify, edit, suspend or remove listings.",
        ],
      },
      {
        h2: "Payments & refunds (our paid plans)",
        body: [
          "Paid business plans, advertising and event tickets (where enabled) are processed by Stripe. Fees and billing cycles are shown at the point of purchase. Subscriptions renew until cancelled; you can cancel at any time and your plan runs to the end of the paid period. Where we offer a money-back guarantee, its terms are shown at checkout. To request a refund or cancel, contact us at hello@humblehalal.com.",
        ],
      },
      {
        h2: "Hotel & flight bookings (travel)",
        bullets: [
          "Hotel and flight bookings are provided through our travel partner LiteAPI (Nuitée), which acts as the merchant of record and processes payment — Humble Halal is not the seller of the travel product.",
          "Prices, availability, baggage, times and fare rules can change until a booking is confirmed; the details shown at booking apply.",
          "Cancellations, changes and refunds follow the specific hotel's or airline's policy shown before you pay. You can manage and cancel eligible bookings in My Trips; refunds (where due) are handled by the travel partner under that policy.",
          "Always confirm Muslim-friendly facilities, meal arrangements and any specific halal requirements directly with the hotel or airline — see our Halal Disclaimer.",
        ],
      },
      {
        h2: "Service providers",
        body: [
          "We rely on third-party providers to operate the service, including Stripe (our paid plans), LiteAPI/Nuitée (travel bookings & payment), Resend and MailerLite (email), Supabase (database), Vercel (hosting) and OneMap/OpenStreetMap (maps). Your use of features that involve them may also be subject to their terms.",
        ],
      },
      {
        h2: "Suspension & termination",
        body: [
          "We may suspend or remove listings, reviews or accounts that breach these terms, are fraudulent or unlawful, infringe others' rights, or harm the platform or its users. Where practical we'll give notice; serious cases may be actioned immediately.",
        ],
      },
      {
        h2: "Disclaimers & liability",
        body: [
          "The service is provided “as is”. To the extent permitted by law, we exclude warranties and are not liable for indirect or consequential loss, or for decisions you make based on listing or halal-status information. Nothing limits liability that cannot be excluded by law.",
        ],
      },
      {
        h2: "Governing law & disputes",
        body: [
          `These terms are governed by the laws of Singapore and you submit to the non-exclusive jurisdiction of the Singapore courts. We'd much rather resolve things informally first — please contact us at ${PRIVACY_EMAIL} or hello@humblehalal.com, ${OPERATOR}, ${ADDRESS}, and we'll work with you in good faith.`,
        ],
      },
    ],
  },

  cookies: {
    slug: "cookies",
    title: "Cookie Policy",
    updated: UPDATED,
    intro: "This policy explains the cookies and browser storage Humble Halal uses.",
    sections: [
      {
        h2: "Essential storage",
        body: [
          "We use your browser's localStorage to remember your saved places, collections, language and preferences, and to record your cookie-consent choice. This is necessary for the site to work and stays on your device.",
        ],
      },
      {
        h2: "Analytics (only with consent)",
        body: [
          "If we enable analytics in future, we will only set analytics cookies after you accept them in the consent banner. You can change your choice at any time by clearing site data.",
        ],
      },
      {
        h2: "Third parties",
        body: [
          "Embedded map tiles (OpenStreetMap) and payment pages (Stripe) may set their own cookies when used. These are governed by their respective policies.",
        ],
      },
      {
        h2: "Managing cookies",
        body: [
          "You can clear or block cookies and local storage in your browser settings. Blocking essential storage may affect features like saved places.",
        ],
      },
    ],
  },

  accessibility: {
    slug: "accessibility",
    title: "Accessibility Statement",
    updated: UPDATED,
    intro: "We want Humble Halal to be usable by everyone, including people who rely on assistive technology.",
    sections: [
      {
        h2: "Our commitment",
        body: [
          "We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA as a target across the site.",
        ],
      },
      {
        h2: "What we do",
        bullets: [
          "Semantic HTML, headings and landmarks for screen readers.",
          "Keyboard-navigable controls with visible focus states.",
          "Descriptive labels on icon-only buttons and links.",
          "A “skip to content” link and sensible colour contrast.",
          "Real, crawlable links and text alternatives for images.",
        ],
      },
      {
        h2: "Known limitations & feedback",
        body: [
          `Some interactive maps and third-party embeds may be harder to use with assistive technology; we're improving these. If you hit an accessibility barrier, tell us at ${PRIVACY_EMAIL} and we'll help and prioritise a fix.`,
        ],
      },
    ],
  },
};

export const legalSlugs = Object.keys(legalDocs);
