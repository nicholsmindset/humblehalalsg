/* Humble Halal — contact intent helpers. Turn raw business contact fields into
   real, tappable hrefs (tel:, wa.me, website, Instagram). Singapore-aware. */

/** tel: link — keep leading + and digits only. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

/** WhatsApp deep link. Normalises SG 8-digit mobiles to +65. */
export function waHref(phone: string, text?: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.length === 8) d = "65" + d; // bare SG mobile → add country code
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${d}${q}`;
}

/** Ensure a website value is an absolute URL. */
export function webHref(web: string): string {
  return /^https?:\/\//i.test(web) ? web : `https://${web}`;
}

/** Instagram profile link from a handle or URL. */
export function igHref(ig: string): string {
  if (/^https?:\/\//i.test(ig)) return ig;
  return `https://instagram.com/${ig.replace(/^@/, "")}`;
}
