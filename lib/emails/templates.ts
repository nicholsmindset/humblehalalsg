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
      p(`${o.dateLabel ? `📅 ${esc(o.dateLabel)}<br>` : ""}${o.venue ? `📍 ${esc(o.venue)}<br>` : ""}${o.ref ? `Reference: <strong>${esc(o.ref)}</strong>` : ""}`) +
      (o.ref ? p(`At the door, show the QR code on your ticket — or just give this reference to be checked in.`) : ""),
    { label: "View your ticket", url: `${U}/dashboard?tab=tickets` },
    `Can't make it? You can release your spot from your tickets.`,
  );
}
export function ticketConfirmationEmail(o: { eventTitle: string; qty?: number; ref?: string }): Out {
  return wrap(
    `Your tickets for ${o.eventTitle}`,
    "Your tickets are confirmed",
    p(`Thank you for your booking. Your ${o.qty && o.qty > 1 ? `${o.qty} tickets are` : "ticket is"} confirmed for <strong>${esc(o.eventTitle)}</strong>.`) +
      p(`${o.ref ? `Reference: <strong>${esc(o.ref)}</strong><br>` : ""}Show the QR code from your tickets at the door — or give the reference above to be checked in.`),
    { label: "Open my tickets", url: `${U}/dashboard?tab=tickets` },
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

/* ═══ Phase 3 — additional transactional ═══════════════════════════════ */
const stars = (n: number) => "★".repeat(Math.max(0, Math.min(5, n))) + "☆".repeat(Math.max(0, 5 - n));

export function reviewReceivedEmail(o: { name?: string | null; businessName: string; rating: number; text?: string }): Out {
  return wrap(
    `New review for ${o.businessName}`,
    "You've got a new review",
    greet(o.name) +
      p(`Someone just reviewed <strong>${esc(o.businessName)}</strong> — <span style="color:#c19a2e;">${stars(o.rating)}</span> (${o.rating}/5).`) +
      (o.text ? p(`&ldquo;${esc(o.text)}&rdquo;`) : "") +
      p(`Replying shows customers you're listening — thank them, or address their feedback, from your dashboard.`),
    { label: "Reply to the review", url: `${U}/owner` },
  );
}
export function bookingRefundedEmail(o: { name?: string | null; kind: "hotel" | "flight"; ref?: string }): Out {
  const what = o.kind === "hotel" ? "hotel booking" : "flight booking";
  return wrap(
    `Your ${what} has been refunded`,
    "Refund processed",
    greet(o.name) +
      p(`Your ${what}${o.ref ? ` (ref <strong>${esc(o.ref)}</strong>)` : ""} has been cancelled and refunded. The amount will return to your original payment method within 5–10 business days.`),
    { label: "View your trips", url: `${U}/travel/trips` },
  );
}
export function bookingFailedEmail(o: { name?: string | null; kind: "hotel" | "flight" }): Out {
  const what = o.kind === "hotel" ? "hotel booking" : "flight booking";
  return wrap(
    `We couldn't complete your ${what}`,
    "Booking not completed",
    greet(o.name) +
      p(`We're sorry — we weren't able to confirm your ${what}, and <strong>you have not been charged</strong>. Please try again, or reply to this email and we'll be glad to help.`),
    { label: "Try again", url: `${U}/travel` },
  );
}
export function leadConfirmationEmail(o: { name?: string | null }): Out {
  return wrap(
    "We've received your request",
    "Thanks — we'll be in touch",
    greet(o.name) +
      p(`Thank you for your enquiry. We've received your details and the right person will get back to you shortly, usually within 1–2 business days.`),
    { label: "Explore Humble Halal", url: `${U}/explore` },
  );
}
/* ── Lead marketplace ────────────────────────────────────────────────── */
export function leadRoutedEmail(o: { name?: string | null; vertical: string; area?: string | null; budget?: string | null; when?: string | null }): Out {
  // NEVER include the consumer's PII — the owner unmasks it in-app on accept.
  const bits = [o.area && `in ${esc(o.area)}`, o.budget && `budget ${esc(o.budget)}`, o.when && `for ${esc(o.when)}`].filter(Boolean).join(" · ");
  return wrap(
    `New ${o.vertical} enquiry for you`,
    "You've got a new lead",
    greet(o.name) +
      p(`A customer is looking for <strong>${esc(o.vertical)}</strong>${bits ? ` — ${bits}` : ""} and we've matched them to your business on Humble Halal.`) +
      p(`Open your dashboard to see the full request and accept it to unlock their contact details. Leads are shared with a few providers, so quick replies win.`),
    { label: "View this lead", url: `${U}/owner?tab=leads` },
    `You're receiving this because your listing matched this request. Manage your lead preferences in your dashboard.`,
  );
}
export function leadPlanStartedEmail(o: { name?: string | null; quota: number }): Out {
  return wrap(
    "Your Lead Inbox is active",
    "You're set to receive leads",
    greet(o.name) +
      p(`Your <strong>Lead Inbox</strong> is now active — you can accept up to <strong>${o.quota}</strong> matched leads this month. We'll email you whenever a new enquiry matches your categories and areas.`) +
      p(`Set your categories and coverage areas in your dashboard so we only send you the leads you want.`),
    { label: "Open your leads", url: `${U}/owner?tab=leads` },
  );
}
export function payoutConnectedEmail(o: { name?: string | null }): Out {
  return wrap(
    "Your payout account is ready",
    "Payouts are set up",
    greet(o.name) +
      p(`Your payout account is connected. When you sell tickets, your earnings are paid out automatically to your bank — no extra steps needed.`),
    { label: "Open your dashboard", url: `${U}/owner` },
  );
}
export function planStartedEmail(o: { name?: string | null; plan: string }): Out {
  return wrap(
    `Your ${o.plan} plan is active`,
    `Welcome to ${esc(o.plan)}`,
    greet(o.name) +
      p(`Your <strong>${esc(o.plan)}</strong> plan is now active — thank you for supporting Humble Halal and Singapore's halal community. You can view invoices, update your card or change plan anytime.`),
    { label: "Manage billing", url: `${U}/owner` },
  );
}

/* ── Halal Passport (loyalty + referrals) ────────────────────────────── */
export function referralJoinedEmail(o: { name?: string | null }): Out {
  return wrap(
    "A friend joined with your invite 🎉",
    "Your invite worked",
    greet(o.name) +
      p(`Good news — a friend just joined Humble Halal using your invite link. You'll both earn Halal Passport points as soon as they leave their first review or collect their first stamp.`) +
      p(`Keep sharing your link to climb toward the <strong>Community Ambassador</strong> badge.`),
    { label: "Open your Passport", url: `${U}/passport` },
  );
}
export function referralQualifiedEmail(o: { name?: string | null; points: number }): Out {
  return wrap(
    `You earned ${o.points} Passport points`,
    "Referral reward unlocked",
    greet(o.name) +
      p(`Your invited friend just made their first move on Humble Halal — so <strong>${o.points} Halal Passport points</strong> have landed in your account. Thank you for growing the community.`),
    { label: "See your points", url: `${U}/passport` },
  );
}
export function badgeEarnedEmail(o: { name?: string | null; badge: string }): Out {
  return wrap(
    `You unlocked the ${o.badge} badge`,
    `New badge: ${esc(o.badge)}`,
    greet(o.name) +
      p(`Nice work — you just earned the <strong>${esc(o.badge)}</strong> badge on your Halal Passport. Show it off or keep collecting.`),
    { label: "View your badges", url: `${U}/passport` },
  );
}
export function tierUpEmail(o: { name?: string | null; tier: string }): Out {
  return wrap(
    `You reached ${o.tier} on Humble Halal`,
    `Welcome to ${esc(o.tier)}`,
    greet(o.name) +
      p(`You've levelled up to <strong>${esc(o.tier)}</strong> on your Halal Passport. Keep reviewing, collecting stamps and inviting friends to reach the next tier.`),
    { label: "Open your Passport", url: `${U}/passport` },
  );
}
export function giveawayWonEmail(o: { name?: string | null; title: string }): Out {
  return wrap(
    `You won: ${o.title} 🎉`,
    "Congratulations — you won!",
    greet(o.name) +
      p(`Amazing news — you won <strong>${esc(o.title)}</strong> in this month's Halal Passport giveaway! Our team will be in touch shortly about claiming your prize.`) +
      p(`Thank you for being an active member of the Humble Halal community.`),
    { label: "Open your Passport", url: `${U}/passport` },
  );
}

/* ═══ Rebrands of the existing inline-HTML emails ══════════════════════ */
export function fareAlertEmail(o: { route: string; oldPrice: string; newPrice: string; url?: string }): Out {
  return wrap(
    `Price drop: ${o.route}`,
    "A flight you're watching just got cheaper",
    p(`Good news — <strong>${esc(o.route)}</strong> dropped from ${esc(o.oldPrice)} to <strong style="color:#0b5d3b;">${esc(o.newPrice)}</strong>.`) +
      p(`Fares move fast — book soon to lock in the lower price.`),
    { label: "See the fare", url: o.url || `${U}/travel/flights` },
  );
}
export function freshnessNudgeEmail(o: { name?: string | null; businessName: string; restampUrl: string }): Out {
  return wrap(
    `Keep ${o.businessName} looking fresh`,
    "A quick confirm keeps your listing trusted",
    greet(o.name) +
      p(`It's been a while since <strong>${esc(o.businessName)}</strong> was last confirmed. A quick one-tap re-confirm keeps your "last verified" date fresh — customers trust recently-verified listings more.`),
    { label: "Confirm my details", url: o.restampUrl },
  );
}
export function certExpiryEmail(o: { name?: string | null; businessName: string; certNo?: string; expiresOn: string }): Out {
  return wrap(
    `Your halal certificate is expiring`,
    "Time to renew your certificate",
    greet(o.name) +
      p(`The halal certificate on file for <strong>${esc(o.businessName)}</strong>${o.certNo ? ` (${esc(o.certNo)})` : ""} expires on <strong>${esc(o.expiresOn)}</strong>.`) +
      p(`Renew with MUIS and upload the new certificate to keep your verified badge active.`),
    { label: "Upload new certificate", url: `${U}/owner` },
  );
}
export function ownerDigestEmail(o: { name?: string | null; businessName: string; views: number; enquiries: number; whatsapp: number; calls: number }): Out {
  return wrap(
    `Your week on Humble Halal — ${o.businessName}`,
    "Here's how you did this week",
    greet(o.name) +
      p(`A quick snapshot for <strong>${esc(o.businessName)}</strong> over the last 7 days:`) +
      p(`👀 <strong>${o.views}</strong> profile views<br>✉️ <strong>${o.enquiries}</strong> enquiries<br>💬 <strong>${o.whatsapp}</strong> WhatsApp taps<br>📞 <strong>${o.calls}</strong> calls`),
    { label: "See full insights", url: `${U}/owner` },
  );
}
export function eventReminderEmail(o: { name?: string | null; eventTitle: string; dateLabel?: string; venue?: string }): Out {
  return wrap(
    `Tomorrow: ${o.eventTitle}`,
    "Your event is coming up",
    greet(o.name) +
      p(`Just a reminder that <strong>${esc(o.eventTitle)}</strong> is happening soon.`) +
      p(`${o.dateLabel ? `📅 ${esc(o.dateLabel)}<br>` : ""}${o.venue ? `📍 ${esc(o.venue)}` : ""}`),
    { label: "View your ticket", url: `${U}/dashboard?tab=tickets` },
  );
}
export function joinApprovedEmail(o: { name?: string | null; eventTitle: string }): Out {
  return wrap(
    `You're in: ${o.eventTitle}`,
    "Your request was approved",
    greet(o.name) +
      p(`Great news — your request to join <strong>${esc(o.eventTitle)}</strong> has been approved. Your ticket is ready.`),
    { label: "Open my tickets", url: `${U}/dashboard?tab=tickets` },
  );
}
export function joinDeclinedEmail(o: { name?: string | null; eventTitle: string }): Out {
  return wrap(
    `Update on ${o.eventTitle}`,
    "About your request to join",
    greet(o.name) +
      p(`Thank you for your interest in <strong>${esc(o.eventTitle)}</strong>. Unfortunately the organiser wasn't able to approve your request this time — often it's simply a capacity limit. We hope to see you at a future event.`),
    { label: "Browse events", url: `${U}/events` },
  );
}
export function eventCancelledEmail(o: { name?: string | null; eventTitle: string; refunded?: boolean }): Out {
  return wrap(
    `Cancelled: ${o.eventTitle}`,
    "This event has been cancelled",
    greet(o.name) +
      p(`We're sorry to let you know that <strong>${esc(o.eventTitle)}</strong> has been cancelled by the organiser.`) +
      (o.refunded ? p(`Any payment will be fully refunded to your original method within 5–10 business days.`) : "") +
      p(`We apologise for the inconvenience.`),
    { label: "Find other events", url: `${U}/events` },
  );
}
export function ticketResendEmail(o: { tickets: { title: string; ref: string }[] }): Out {
  const rows = o.tickets.map((t) => `<tr><td style="padding:6px 0;font-size:15px;color:#1c2621;">${esc(t.title)}</td><td style="padding:6px 0;font-size:14px;color:#5b6b62;text-align:right;">${esc(t.ref)}</td></tr>`).join("");
  return wrap(
    "Your Humble Halal tickets",
    "Here are your tickets",
    p(`As requested, here are your tickets — open them to show the QR code at the door.`) +
      `<table role="presentation" width="100%" style="border-top:1px solid #e7e1d5;margin:8px 0;">${rows}</table>`,
    { label: "Open my tickets", url: `${U}/dashboard?tab=tickets` },
  );
}

/* ═══ Go-live batch — acknowledgements, payouts, review replies ═════════ */

/** Anonymous "suggest a business" form — acknowledge an optional email. */
export function suggestionAckEmail(o: { name?: string | null }): Out {
  return wrap(
    "Thanks for your suggestion",
    "We've received your suggestion",
    greet(o.name) +
      p(`Thank you for suggesting a halal spot to Humble Halal. Our team reviews every recommendation to keep the directory trustworthy — if it's a good fit, we'll add it soon.`) +
      p(`Jazakumullah khair for helping the community discover great halal places.`),
    { label: "Explore the directory", url: `${U}/explore` },
    `You don't need to do anything else — this is just to let you know it arrived.`,
  );
}

/** Anonymous "report an issue" form — acknowledge an optional email. */
export function reportAckEmail(o: { name?: string | null }): Out {
  return wrap(
    "Thanks — we've received your report",
    "Your report is with our team",
    greet(o.name) +
      p(`Thank you for flagging this. We've received your report and our team will look into it to keep listings accurate for everyone.`) +
      p(`Reports like yours are how we keep Humble Halal trustworthy — jazakumullah khair.`),
    { label: "How we verify", url: `${U}/verify` },
    `You don't need to do anything else — this is just to let you know it arrived.`,
  );
}

/** Organiser payout notice — sent when an event payout is transferred. */
export function payoutSentEmail(o: { name?: string | null; amount: string; eventTitle?: string | null }): Out {
  return wrap(
    "Your payout is on its way",
    "We've sent your payout",
    greet(o.name) +
      p(`Good news — we've sent a payout of <strong style="color:#0b5d3b;">${esc(o.amount)}</strong>${o.eventTitle ? ` for <strong>${esc(o.eventTitle)}</strong>` : ""} to your connected bank account.`) +
      p(`Depending on your bank, it typically lands within a few business days. You can see the full breakdown of ticket sales and fees from your dashboard.`),
    { label: "View your payouts", url: `${U}/owner` },
  );
}

/** Notify a reviewer that the business owner replied to their review. */
export function reviewReplyEmail(o: { name?: string | null; businessName: string; reply: string }): Out {
  return wrap(
    `${o.businessName} replied to your review`,
    "You've got a reply",
    greet(o.name) +
      p(`<strong>${esc(o.businessName)}</strong> just replied to the review you left on Humble Halal:`) +
      p(`&ldquo;${esc(o.reply)}&rdquo;`) +
      p(`Thank you for sharing your experience — reviews like yours help the whole community discover trustworthy halal places.`),
    { label: "See the reply", url: `${U}/explore` },
  );
}
