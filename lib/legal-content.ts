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
const UPDATED = "30 September 2026";
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
          "Name and email — when you contact us or previously used a retired business feature.",
          "Approximate location — only when you use a location-based tool and grant permission.",
          "Usage preferences and consent choices — stored locally in your browser.",
        ],
      },
      {
        h2: "How we use it",
        bullets: [
          "To publish guides and operate free tools.",
          "To send the newsletter you asked for (you can unsubscribe any time).",
          "To respond to contact messages and correction requests.",
          "To retain and resolve records from retired business and transaction features where necessary.",
          "We do not sell your personal data.",
        ],
      },
      {
        h2: "Who we share it with",
        body: [
          "We use trusted service providers (data intermediaries) only to the extent needed to operate the service. Each receives only the data required for its purpose:",
        ],
        bullets: [
          "Beehiiv — newsletter delivery (email address, plus the signup source so we know which page you subscribed from).",
          "Resend — transactional email such as account and contact emails (email address + message content).",
          "Stripe — records and administration for transactions made before paid features were retired.",
          "Supabase — database and storage for remaining or historical account data.",
          "Vercel — website hosting.",
          "OneMap (Singapore Land Authority) and OpenStreetMap — location tools where used.",
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
          "We use browser storage to remember preferences and your cookie-consent choice. See our Cookie Policy for details.",
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
          "Contact messages — up to about 12 months after they are resolved.",
          "Historical submissions, reviews and transactions from retired features — retained or removed according to applicable obligations and deletion requests.",
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
          "Publishing guides and operating free tools.",
          "Sending content and emails you asked for (newsletter, account and contact emails).",
          "Responding to contact messages and correction requests.",
          "Resolving records and obligations from retired features.",
        ],
      },
      {
        h2: "Quote requests & sharing with providers",
        body: [
          "Quote requests are no longer accepted. Requests submitted before this feature was retired may have been shared with relevant providers under the consent given at the time. We do not sell your details for unrelated marketing.",
          `To ask about a past request or withdraw consent for processing that still depends on it, email ${PRIVACY_EMAIL}. Some records may be retained where required to resolve a past transaction or comply with law.`,
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
          "Humble Halal publishes guides and offers free tools for Muslim life in Singapore. We are not a halal certifier. For certification, check the official MUIS HalalSG register and verify current details before relying on an article — see our Halal Disclaimer.",
        ],
      },
      {
        h2: "Information & accuracy",
        body: [
          "Articles and tool information can become outdated or contain errors. We make reasonable efforts to keep it accurate but do not guarantee it. Contact us if you spot a correction. Verify restaurant details and halal certification with the business and MUIS before visiting.",
        ],
      },
      {
        h2: "Your submissions",
        bullets: [
          "You must own or have the right to post what you submit, and it must be honest and lawful.",
          "No spam, hate speech, harassment, false claims, or content that infringes others' rights.",
          "If you previously submitted a review or send us content, you grant us a licence to display it on Humble Halal. We may moderate or remove submitted content.",
        ],
      },
      {
        h2: "Historical business listings & claims",
        body: [
          "Business listing and claim features are retired. If you previously submitted or claimed a listing, you confirmed that you were authorised to represent the business and that the information was accurate. Contact us about historical records or corrections.",
        ],
      },
      {
        h2: "Historical payments & refunds",
        body: [
          "We no longer offer paid business plans, advertising or event tickets. Stripe may retain records of past transactions. The terms shown at the time of purchase govern any past order or subscription. To ask about a charge, cancellation or refund, contact hello@humblehalal.com.",
        ],
      },
      {
        h2: "Service providers",
        body: [
          "We rely on third-party providers to operate the site, including Beehiiv and Resend (email), Supabase (data), Vercel (hosting) and OneMap/OpenStreetMap (location tools). Stripe may process historical transaction records. Your use of features that involve these providers may also be subject to their terms.",
        ],
      },
      {
        h2: "Suspension & termination",
        body: [
          "We may remove submissions or restrict accounts that breach these terms, are fraudulent or unlawful, infringe others' rights, or harm the site or its users. Where practical we'll give notice; serious cases may be actioned immediately.",
        ],
      },
      {
        h2: "Disclaimers & liability",
        body: [
          "The service is provided “as is”. To the extent permitted by law, we exclude warranties and are not liable for indirect or consequential loss, or for decisions you make based on articles or halal-related information. Nothing limits liability that cannot be excluded by law.",
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
        h2: "Analytics (with consent)",
        body: [
          "With your consent we use Google Analytics 4 and Microsoft Clarity to understand how the site is used so we can improve it. These set analytics cookies/identifiers only after you accept analytics in the consent banner; until then they run in a cookieless, modelled mode. You can change or withdraw your choice at any time by clearing this site's cookies and local storage.",
        ],
      },
      {
        h2: "Advertising (with consent)",
        body: [
          "With your consent we show ads through Google AdSense and may use advertising and measurement pixels from Meta, TikTok, LinkedIn and Google Ads. Until you accept marketing cookies, ads are served in a non-personalised mode and these advertising pixels stay blocked.",
        ],
      },
      {
        h2: "Third parties",
        body: [
          "Google (AdSense and Analytics), embedded map tiles (OpenStreetMap) and payment pages (Stripe) may set their own cookies when used. These are governed by their respective privacy and cookie policies.",
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
