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
  sections: LegalSection[];
}

const OPERATOR = "ONN GROUP LLP";
const ADDRESS = "60 Paya Lebar Road, #06-28 Paya Lebar Square, Singapore 409051";
const PRIVACY_EMAIL = "privacy@humblehalal.com";
const UPDATED = "11 June 2026";

export const legalDocs: Record<string, LegalDoc> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    updated: UPDATED,
    intro: `Humble Halal is operated by ${OPERATOR} (“we”, “us”). This policy explains what personal data we collect, why, and your rights under Singapore's Personal Data Protection Act (PDPA).`,
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
        h2: "Who we share it with",
        body: [
          "We use trusted service providers (data intermediaries) only to the extent needed to operate the service:",
        ],
        bullets: [
          "MailerLite — newsletter delivery.",
          "Stripe — payment processing (only if you make a paid transaction).",
          "Supabase — database and storage (when account features are enabled).",
          "Vercel — website hosting.",
          "OneMap (Singapore Land Authority) — address lookup; OpenStreetMap — map tiles.",
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
        h2: "Retention & security",
        body: [
          "We keep personal data only as long as needed for the purposes above or as required by law, then delete or anonymise it. We apply reasonable security measures, but no system is perfectly secure.",
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
    sections: [
      {
        h2: "Consent & purpose",
        body: [
          "We collect, use and disclose personal data only for purposes you would reasonably expect — running the directory, sending content you requested, and processing your submissions — and we seek your consent where required.",
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
          "If a notifiable data breach occurs, we will assess and notify the PDPC and affected individuals as required under the PDPA's Data Breach Notification obligation.",
        ],
      },
    ],
  },

  terms: {
    slug: "terms",
    title: "Terms of Service",
    updated: UPDATED,
    intro: `These terms govern your use of Humble Halal, operated by ${OPERATOR}. By using the site you agree to them.`,
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
        h2: "Payments",
        body: [
          "Paid plans, advertising and event tickets (where enabled) are processed by Stripe. Fees, billing cycles and refund terms are shown at the point of purchase.",
        ],
      },
      {
        h2: "Disclaimers & liability",
        body: [
          "The service is provided “as is”. To the extent permitted by law, we exclude warranties and are not liable for indirect or consequential loss, or for decisions you make based on listing or halal-status information. Nothing limits liability that cannot be excluded by law.",
        ],
      },
      {
        h2: "Governing law & contact",
        body: [
          `These terms are governed by the laws of Singapore. Questions: ${PRIVACY_EMAIL}, ${OPERATOR}, ${ADDRESS}.`,
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
