import "server-only";
import { randomBytes } from "crypto";

/* Human-friendly ticket references.

   The RSVP/checkout flows used to email a decorative "HH-RSVP-1234" that was
   never stored anywhere, while the actual tickets got raw UUID qr_refs — so
   typing the emailed reference at the door always failed "Ticket not
   recognised". These helpers make the emailed reference and the stored
   qr_ref the SAME value:

     order ref            HH-RSVP-7K3MQZ         (emailed to the buyer)
     ticket qr_refs       HH-RSVP-7K3MQZ          (qty 1)
                          HH-RSVP-7K3MQZ-1 … -n   (qty > 1)

   The QR code on each ticket encodes the full qr_ref; the door check-in
   accepts a scanned qr_ref, a typed ref in any case, or the bare order ref
   (checking in the order's next unused ticket). */

// No 0/O/1/I/L — unambiguous when read over a shoulder at the door.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeOrderRef(kind: "RSVP" | "TKT"): string {
  const bytes = randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `HH-${kind}-${s}`;
}

/** qr_ref per ticket for an order of `qty`, derived from the order ref. */
export function ticketRefs(base: string, qty: number): string[] {
  return qty === 1 ? [base] : Array.from({ length: qty }, (_, i) => `${base}-${i + 1}`);
}
