// agent-browser init script — registered via `--init-script scripts/ab/seed.js`.
// Runs in the page BEFORE first paint on every navigation, pre-accepting consent,
// onboarding, and the newsletter popup so those overlays don't sit on top of the
// content and skew the mobile probes. Keys mirror e2e/mobile.spec.ts exactly so
// agent-browser sweeps and the Playwright gate seed identical state.
(() => {
  try {
    // Proper v1 consent object — a legacy string re-triggers the banner.
    localStorage.setItem(
      "hh_consent_v1",
      JSON.stringify({ analytics: true, marketing: false, ts: Date.now(), v: 1 })
    );
    localStorage.setItem(
      "hh_state_v1",
      JSON.stringify({ prefs: { onboarded: true, homeArea: "", certifiedOnly: false } })
    );
    localStorage.setItem("hh_nl_popup", "dismissed");
  } catch {
    /* ignore — storage may be unavailable on some origins */
  }
})();
