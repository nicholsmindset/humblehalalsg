/* Humble Halal — MUIS HalalSG verification helpers.

   IMPORTANT: We do NOT scrape, crawl or mirror the MUIS register. MUIS provides
   no public API or open dataset for halal establishments, and bulk-copying the
   register is not permitted. Instead we:
     1) deep-link to the official public register so admins and users verify at
        the source, and
     2) record our OWN dated assertion (cert no / scheme / expiry) alongside.
   Bulk/automated use is deferred until a formal MUIS data-sharing arrangement. */

/** Official MUIS HalalSG public establishments register. */
export const HALALSG_BASE = "https://halal.muis.gov.sg/halal/establishments";

/** Strip characters the MUIS HalalSG WAF rejects. Names with parentheticals
    (e.g. "Osia Steak & Seafood Grill (Resorts World)") return a 469/4xx — drop
    the bracketed parts and punctuation, keeping the core brand for the keyword. */
export function sanitizeForHalalSg(name: string): string {
  return name
    .replace(/\([^)]*\)/g, " ")        // remove "(Resorts World)" etc.
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^A-Za-z0-9\s'-]/g, " ")  // keep only WAF-safe chars (drops & ( ) , . etc.)
    .replace(/\s+/g, " ")
    .trim();
}

/** Deep-link to the official register, prefilled with a (sanitized) business
    name to streamline the manual lookup. If the query param is ignored by MUIS,
    the search page still opens for the admin to type the name. */
export function halalSgSearchUrl(name?: string): string {
  const q = sanitizeForHalalSg(name || "");
  return q ? `${HALALSG_BASE}?keyword=${encodeURIComponent(q)}` : HALALSG_BASE;
}

/** Deep-link to the official register prefilled with the certificate number
    when we have one on file (the strongest lookup), falling back to the business
    name. Cert numbers are searchable on the public register's keyword field. */
export function halalSgVerifyUrl(certNo?: string | null, name?: string): string {
  const cert = normalizeCertNo(certNo);
  return cert ? `${HALALSG_BASE}?keyword=${encodeURIComponent(cert)}` : halalSgSearchUrl(name);
}

/** Normalise a MUIS cert number for storage/display (trim + uppercase). */
export function normalizeCertNo(certNo?: string | null): string {
  return (certNo || "").trim().toUpperCase();
}
