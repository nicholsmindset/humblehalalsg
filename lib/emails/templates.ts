/* Humble Halal — transactional email templates. Each returns { subject, html }
   built from the shared branded emailLayout(). Warm, lightly-Islamic tone:
   opens "Assalamualaikum {name}," and signs off with salaam (in the footer).
   Copy is mirrored in docs/emails/copy.md for review. */
import { SITE } from "@/lib/seo";
import { emailLayout, esc, p, type EmailCTA } from "./layout";

const U = SITE.url;
const first = (name?: string | null) => (name ? esc(String(name).trim().split(/\s+/)[0]) : "there");
const greet = (name?: string | null) => p(`Assalamualaikum ${first(name)},`);
type Out = { subject: string; html: string };
const wrap = (subject: string, heading: string, body: string, cta?: EmailCTA, footerNote?: string, preheader?: string): Out =>
  ({ subject, html: emailLayout({ preheader: preheader || subject, heading, bodyHtml: body, cta, footerNote }) });

/* ── Business owner — claims ─────────────────────────────────────────── */
export function claimSubmittedEmail(o: { name?: string | null; businessName: string }): Out {
  return wrap(
    `We've received your claim for ${o.businessName}`,
    "Your claim is in review",
    greet(o.name) +
      p(`Thank you for claiming <strong>${esc(o.businessName)}</strong> on Humble Halal. Our team will verify ownership and get back to you shortly — usually within 1–2 business days.`) +
      p(`Once approved, you'll be able to manage your listing: update your details, opening hours and photos, reply to reviews, and see who's discovering you.`),
    undefined,
    `If you didn't request this, you can safely ignore this email.`,
  );
}
export function claimApprovedEmail(o: { name?: string | null; businessName: string }): Out {
  return wrap(
    `You're verified as the owner of ${o.businessName} 🎉`,
    `Welcome — ${esc(o.businessName)} is yours to manage`,
    greet(o.name) +
      p(`Good news — your ownership of <strong>${esc(o.businessName)}</strong> has been approved. You now have full control of your listing on Humble Halal.`) +
      p(`From your dashboard you can update your contact details, address, opening hours and photos, reply to customer reviews, and track how many people are viewing and contacting you.`) +
      p(`<strong>Tip:</strong> upload your MUIS halal certificate to earn the verified badge — it's the strongest trust signal for customers.`),
    { label: "Open your dashboard", url: `${U}/owner` },
  );
}
export function claimRejectedEmail(o: { name?: string | null; businessName: string }): Out {
  return wrap(
    `Update on your claim for ${o.businessName}`,
    "We couldn't verify this claim",
    greet(o.name) +
      p(`Thank you for your interest in managing <strong>${esc(o.businessName)}</strong>. Unfortunately we weren't able to verify your ownership with the information provided.`) +
      p(`If you believe this is a mistake, just reply to this email with proof of ownership (business registration, a utility bill, or your MUIS certificate) and we'll take another look.`),
    { label: "Try claiming again", url: `${U}/claim` },
  );
}
export function claimAdminAlertEmail(o: { businessName: string; claimantEmail?: string | null; role?: string | null }): Out {
  return wrap(
    `New ownership claim: ${o.businessName}`,
    "A new claim needs review",
    p(`<strong>${esc(o.businessName)}</strong> has a pending ownership claim${o.role ? ` (role: ${esc(o.role)})` : ""}${o.claimantEmail ? ` from ${esc(o.claimantEmail)}` : ""}.`),
    { label: "Review in admin", url: `${U}/admin` },
  );
}

/* ── Business owner — listings ───────────────────────────────────────── */
export function listingSubmittedEmail(o: { name?: string | null; businessName: string }): Out {
  return wrap(
    `Thanks for adding ${o.businessName}`,
    "Your listing is in review",
    greet(o.name) +
      p(`Thank you for adding <strong>${esc(o.businessName)}</strong> to Humble Halal. Our team reviews every submission to keep the directory trustworthy — you'll hear from us within 1–2 business days.`),
    undefined,
    `We'll email you as soon as it's live.`,
  );
}
export function listingApprovedEmail(o: { name?: string | null; businessName: string }): Out {
  return wrap(
    `${o.businessName} is now live on Humble Halal 🎉`,
    `${esc(o.businessName)} is live`,
    greet(o.name) +
      p(`Your listing for <strong>${esc(o.businessName)}</strong> has been approved and is now discoverable to Singapore's Muslim community.`) +
      p(`Head to your dashboard to add photos, opening hours and contact details, and to reply to reviews. Adding your MUIS certificate unlocks the verified badge.`),
    { label: "Manage your listing", url: `${U}/owner` },
  );
}
export function listingRejectedEmail(o: { name?: string | null; businessName: string }): Out {
  return wrap(
    `Update on your ${o.businessName} submission`,
    "We need a little more before publishing",
    greet(o.name) +
      p(`Thank you for submitting <strong>${esc(o.businessName)}</strong>. We couldn't publish it just yet — it may be a duplicate, missing key details, or need clearer halal information.`) +
      p(`Reply to this email with any corrections and we'll be glad to get it live.`),
    { label: "Edit your submission", url: `${U}/add-listing` },
  );
}

/* ── Events ──────────────────────────────────────────────────────────── */
export function rsvpConfirmationEmail(o: { name?: string | null; eventTitle: string; dateLabel?: string; venue?: string; ref?: string }): Out {
  return wrap(
    `You're going: ${o.eventTitle}`,
    "Your RSVP is confirmed",
    greet(o.name) +
      p(`You're confirmed for <strong>${esc(o.eventTitle)}</strong>.`) +
      p(`${o.dateLabel ? `📅 ${esc(o.dateLabel)}<br>` : ""}${o.venue ? `📍 ${esc(o.venue)}<br>` : ""}${o.ref ? `Reference: <strong>${esc(o.ref)}</strong>` : ""}`),
    { label: "View your ticket", url: `${U}/travel/trips` },
    `Can't make it? You can release your spot from your tickets.`,
  );
}
export function ticketConfirmationEmail(o: { eventTitle: string; qty?: number; ref?: string }): Out {
  return wrap(
    `Your tickets for ${o.eventTitle}`,
    "Your tickets are confirmed",
    p(`Thank you for your booking. Your ${o.qty && o.qty > 1 ? `${o.qty} tickets are` : "ticket is"} confirmed for <strong>${esc(o.eventTitle)}</strong>.`) +
      p(`${o.ref ? `Reference: <strong>${esc(o.ref)}</strong><br>` : ""}Show the QR code from your tickets at the door.`),
    { label: "Open my tickets", url: `${U}/travel/trips` },
  );
}
export function eventApprovedEmail(o: { name?: string | null; eventTitle: string; slug?: string }): Out {
  return wrap(
    `Your event is live: ${o.eventTitle}`,
    "Your event has been approved",
    greet(o.name) +
      p(`Congratulations — <strong>${esc(o.eventTitle)}</strong> is now published and open for RSVPs on Humble Halal.`) +
      p(`Share your event page to fill seats, and manage attendees from your dashboard.`),
    { label: "View your event", url: o.slug ? `${U}/events/${esc(o.slug)}` : `${U}/events` },
  );
}

/* ── Travel ──────────────────────────────────────────────────────────── */
export function hotelBookingEmail(o: { name?: string | null; hotelName: string; checkIn?: string; checkOut?: string; ref?: string }): Out {
  return wrap(
    `Booking confirmed: ${o.hotelName}`,
    "Your stay is confirmed",
    greet(o.name) +
      p(`Your booking at <strong>${esc(o.hotelName)}</strong> is confirmed. We hope it's a restful, halal-friendly stay.`) +
      p(`${o.checkIn ? `Check-in: <strong>${esc(o.checkIn)}</strong><br>` : ""}${o.checkOut ? `Check-out: <strong>${esc(o.checkOut)}</strong><br>` : ""}${o.ref ? `Booking reference: <strong>${esc(o.ref)}</strong>` : ""}`),
    { label: "View your trip", url: `${U}/travel/trips` },
  );
}
export function flightBookingEmail(o: { name?: string | null; route: string; dateLabel?: string; ref?: string }): Out {
  return wrap(
    `Flight booked: ${o.route}`,
    "Your flight is booked",
    greet(o.name) +
      p(`Your flight <strong>${esc(o.route)}</strong> is confirmed.`) +
      p(`${o.dateLabel ? `📅 ${esc(o.dateLabel)}<br>` : ""}${o.ref ? `Booking reference: <strong>${esc(o.ref)}</strong>` : ""}`),
    { label: "View your trip", url: `${U}/travel/trips` },
  );
}

/* ── Certificates ────────────────────────────────────────────────────── */
export function certApprovedEmail(o: { name?: string | null; businessName: string }): Out {
  return wrap(
    `${o.businessName} is now verified halal`,
    "Your certificate is approved",
    greet(o.name) +
      p(`We've verified the halal certificate for <strong>${esc(o.businessName)}</strong>. Your listing now carries the verified badge — a strong trust signal for customers.`),
    { label: "See your listing", url: `${U}/owner` },
  );
}
export function certRejectedEmail(o: { name?: string | null; businessName: string; note?: string }): Out {
  return wrap(
    `Update on your certificate for ${o.businessName}`,
    "We couldn't verify this certificate",
    greet(o.name) +
      p(`We reviewed the certificate submitted for <strong>${esc(o.businessName)}</strong> but couldn't verify it${o.note ? `: ${esc(o.note)}` : "."}.`) +
      p(`Please re-upload a clear, valid MUIS certificate from your dashboard and we'll review it again.`),
    { label: "Re-upload certificate", url: `${U}/owner` },
  );
}

/* ── Payments / ads ──────────────────────────────────────────────────── */
export function adPurchaseEmail(o: { productName: string; amount?: string; ref?: string }): Out {
  return wrap(
    `Receipt: ${o.productName}`,
    "Thank you for advertising with us",
    p(`We've received your purchase of <strong>${esc(o.productName)}</strong>${o.amount ? ` (${esc(o.amount)})` : ""}.`) +
      p(`Our team will set up your placement and be in touch. ${o.ref ? `Reference: <strong>${esc(o.ref)}</strong>` : ""}`),
    { label: "View advertising", url: `${U}/advertise` },
  );
}

/* ── General ─────────────────────────────────────────────────────────── */
export function contactAutoReplyEmail(o: { name?: string | null }): Out {
  return wrap(
    `Thanks for reaching out to Humble Halal`,
    "We've got your message",
    greet(o.name) +
      p(`Thank you for contacting us — we've received your message and someone from our team will reply as soon as we can, usually within 1–2 business days.`) +
      p(`In the meantime, feel free to explore the directory or check how we verify halal listings.`),
    { label: "Explore Humble Halal", url: `${U}/explore` },
  );
}
