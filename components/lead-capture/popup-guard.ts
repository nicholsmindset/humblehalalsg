/* Popup coordination (owner subtlety rule): at most ONE popup per session
   site-wide, and the lead-capture popup outranks the newsletter popup on the
   pages where it's mounted — the newsletter popup yields there entirely.
   Client-only module state + sessionStorage. */

const SESSION_KEY = "hh_popup_session"; // "newsletter" | "lead" — whoever showed first

let leadPopupMounted = false;

/** LeadCapturePopup announces itself so NewsletterPopup can yield. */
export function setLeadPopupMounted(on: boolean): void { leadPopupMounted = on; }
export function isLeadPopupMounted(): boolean { return leadPopupMounted; }

export function popupSessionTaken(): boolean {
  try { return !!window.sessionStorage.getItem(SESSION_KEY); } catch { return false; }
}

/** Claim the one-per-session slot. Returns false if another popup already
    showed this session. Private-mode storage failures allow the claim (same
    graceful posture as the newsletter popup's localStorage handling). */
export function claimPopupSession(who: "newsletter" | "lead"): boolean {
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    window.sessionStorage.setItem(SESSION_KEY, who);
    return true;
  } catch {
    return true;
  }
}
