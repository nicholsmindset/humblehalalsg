// Google Tag Manager loader + Google Consent Mode v2 defaults.
//
// Rendered once at the top of <body> in the root layout. The consent-default
// script runs BEFORE the GTM loader (DOM order), so ad_storage/analytics_storage
// are "denied" until the user consents via components/cookie-consent.tsx.
// GA4 then runs in cookieless/modeled mode; all marketing pixels stay blocked
// (per-tag consent settings in the GTM container). Returns null when the
// container id is absent (dev / preview without analytics), so nothing loads.
//
// Server Component — the <script> tags are emitted into the initial HTML and
// execute during parse, guaranteeing consent defaults precede any GTM tag.

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CONSENT_KEY = "hh_consent_v1";

export function GoogleTagManager() {
  if (!GTM_ID) return null;

  const consentDefault = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent','default',{
      ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied',
      analytics_storage:'denied', functionality_storage:'granted',
      security_storage:'granted', wait_for_update:500
    });
    try {
      var c = JSON.parse(localStorage.getItem('${CONSENT_KEY}') || 'null');
      if (c && typeof c === 'object') {
        if (c.marketing) gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});
        if (c.analytics) gtag('consent','update',{analytics_storage:'granted'});
      }
    } catch (e) {}
  `;

  const gtmLoader = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${GTM_ID}');
  `;

  return (
    <>
      {/* Consent defaults FIRST — before GTM loads */}
      <script dangerouslySetInnerHTML={{ __html: consentDefault }} />
      {/* GTM container loader */}
      <script dangerouslySetInnerHTML={{ __html: gtmLoader }} />
      {/* noscript fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="gtm"
        />
      </noscript>
    </>
  );
}
