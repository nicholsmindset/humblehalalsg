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
/* Terminal state for a booking whose payment WAS captured but the provider never
   confirmed (flight-retry cron exhausted). Must NOT reuse bookingFailedEmail —
   that copy says "you have not been charged", which is false here. */
export function bookingChargedNotConfirmedEmail(o: { name?: string | null; kind: "hotel" | "flight"; ref?: string }): Out {
  const what = o.kind === "hotel" ? "hotel booking" : "flight booking";
  return wrap(
    `Your ${what} couldn't be confirmed — refund on the way`,
    "We couldn't confirm your booking",
    greet(o.name) +
      p(`We're sorry — despite repeated attempts we couldn't confirm your ${what}${o.ref ? ` (ref <strong>${esc(o.ref)}</strong>)` : ""} with the travel provider. Your payment was taken, and <strong>we will refund you in full</strong> — there's nothing you need to do. Reply to this email if you'd rather we help you rebook.`),
    { label: "View your trips", url: `${U}/travel/trips` },
  );
}