/* PII masking for routed leads — a business sees the brief (vertical, area,
   budget, date, details) but NOT the consumer's name/email/phone until it
   accepts the lead (which consumes quota). Masking happens server-side in
   /api/owner/leads so unaccepted contact details never reach the client. */

export function maskName(name?: string | null): string {
  const n = String(name || "").trim();
  if (!n) return "New enquiry";
  const parts = n.split(/\s+/);
  const first = parts[0];
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return `${first}${lastInitial}`;
}

export function maskEmail(email?: string | null): string | null {
  const e = String(email || "").trim();
  if (!e || !e.includes("@")) return null;
  const [user, domain] = e.split("@");
  const head = user.slice(0, 1);
  return `${head}${"•".repeat(Math.max(3, user.length - 1))}@${domain}`;
}

export function maskPhone(phone?: string | null): string | null {
  const p = String(phone || "").trim();
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  if (digits.length < 4) return "•••• ••••";
  return `•••• ${digits.slice(-3)}`;
}
