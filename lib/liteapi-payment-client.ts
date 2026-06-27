/* Humble Halal — LiteAPI Payment SDK loader (client-only).
   LiteAPI is merchant of record: prebook returns a `secretKey` (the payment intent),
   the SDK renders a hosted card form, charges the card, then REDIRECTS to `returnUrl`.
   The booking is finalised on that return by calling /api/travel/(book|flights/book)
   with the transactionId. `publicKey` is just the mode string ('sandbox' | 'live'). */

const SDK_SRC = "https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1";

declare global {
  interface Window {
    LiteAPIPayment?: new (cfg: Record<string, unknown>) => { handlePayment: () => void };
  }
}

let loadPromise: Promise<void> | null = null;

/** Inject the LiteAPI Payment SDK <script> once. Resolves when window.LiteAPIPayment
 *  is available; rejects if the script fails to load. */
export function loadLiteApiPaymentSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no_window"));
  if (window.LiteAPIPayment) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    const done = () => (window.LiteAPIPayment ? resolve() : reject(new Error("sdk_global_missing")));
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SRC}"]`);
    if (existing) {
      if (window.LiteAPIPayment) return resolve();
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", () => { loadPromise = null; reject(new Error("sdk_load_failed")); }, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.async = true;
    s.onload = done;
    s.onerror = () => { loadPromise = null; reject(new Error("sdk_load_failed")); };
    document.head.appendChild(s);
  });
  return loadPromise;
}

export interface LaunchPaymentOptions {
  /** 'live' in production (LITEAPI_ENV=prod), else 'sandbox'. */
  mode: "sandbox" | "live";
  /** secretKey from the prebook response (the payment intent). */
  secretKey: string;
  /** CSS selector of the element to mount the card form into. */
  targetSelector: string;
  /** Absolute URL the SDK redirects to after a successful charge. */
  returnUrl: string;
  businessName?: string;
}

/** Load the SDK then render + run the hosted payment form. The SDK redirects to
 *  `returnUrl` on success — the caller completes the booking there. */
export async function launchLiteApiPayment(opts: LaunchPaymentOptions): Promise<void> {
  await loadLiteApiPaymentSdk();
  if (!window.LiteAPIPayment) throw new Error("sdk_unavailable");
  const payment = new window.LiteAPIPayment({
    publicKey: opts.mode,
    appearance: { theme: "flat" },
    options: { business: { name: opts.businessName || "Humble Halal" } },
    targetElement: opts.targetSelector,
    secretKey: opts.secretKey,
    returnUrl: opts.returnUrl,
  });
  payment.handlePayment();
}
