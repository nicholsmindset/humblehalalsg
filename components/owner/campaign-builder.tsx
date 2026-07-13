"use client";

/* Self-serve campaign builder — the owner picks a placement, dates and
   creative, then pays (or files a request when paid ads are off). The draft
   campaign row is created server-side (/api/owner/ads/checkout) and only
   serves after payment AND admin creative approval.

   4 steps on the shared wizard chrome: Placement · Schedule · Creative ·
   Review. The creative step previews with the SAME sponsored-slot markup
   AdSlot renders, so what the owner sees is what actually serves. */

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { track, checkoutMeta } from "@/lib/analytics";
import { BLOCKED_AD_CATEGORIES } from "@/lib/ad-safety";
import { Icon, ImagePh, WizardFooter, WizardSteps } from "../ui";

type PlacementOption = {
  key: string;
  label: string;
  pageType: string;
  positionLabel: string;
  sizeFormat: string;
  monthlyRateCents: number;
  inventoryCap: number;
  booked: number;
};

const STEPS = ["Placement", "Schedule", "Creative", "Review"] as const;
const MONTH_CHOICES = [1, 2, 3] as const;

const money = (cents: number) => `S$${Math.round(cents / 100).toLocaleString()}`;
const todaySG = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function CampaignBuilder({
  businessId,
  businessName,
  initialPlacement,
  toast,
  onClose,
  onSubmitted,
}: {
  businessId: string;
  businessName: string;
  initialPlacement?: string;
  toast: (m: string) => void;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<PlacementOption[] | null>(null);
  const [paidAds, setPaidAds] = useState(true);
  const [placementKey, setPlacementKey] = useState(initialPlacement || "");
  const [startsOn, setStartsOn] = useState(todaySG());
  const [months, setMonths] = useState<number>(1);
  const [title, setTitle] = useState(businessName.slice(0, 80));
  const [body, setBody] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepErr, setStepErr] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Pass the business so paidAds comes back per-business resolved —
        // the same value the checkout route will enforce (audit R5).
        const res = await fetch(`/api/owner/ads/options?business=${encodeURIComponent(businessId)}`);
        const j = await res.json().catch(() => ({}));
        if (!alive) return;
        if (j?.ok && Array.isArray(j.options)) {
          setOptions(j.options as PlacementOption[]);
          setPaidAds(j.paidAds !== false);
        } else setOptions([]);
      } catch {
        if (alive) setOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [businessId]);

  const placement = options?.find((o) => o.key === placementKey) || null;
  const totalCents = placement ? placement.monthlyRateCents * months : 0;

  // Soft brand-safety pre-check — advisory only (the admin review gate is
  // authoritative); flags obvious category words before the owner pays.
  const SAFETY_TERMS: [string, RegExp][] = useMemo(
    () => [
      ["Alcohol", /\b(alcohol|beer|wine|liquor)\b/i],
      ["Gambling & betting", /\b(casino|gambling|betting|lottery|jackpot)\b/i],
      ["Non-halal food", /\b(pork|bacon|lard|non-?halal)\b/i],
      ["Interest-based finance", /\b(payday|personal loan|credit line|interest-free credit)\b/i],
      ["Speculative trading", /\b(crypto|forex|bitcoin|trading signals)\b/i],
    ],
    [],
  );
  const safetyHit = useMemo(() => {
    const text = `${title} ${body}`;
    const hit = SAFETY_TERMS.find(([, re]) => re.test(text));
    return hit ? BLOCKED_AD_CATEGORIES.find((c) => c.label.startsWith(hit[0].split(" ")[0])) || { label: hit[0] } : null;
  }, [title, body, SAFETY_TERMS]);

  const uploadCreative = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("businessId", businessId);
      const res = await fetch("/api/owner/ads/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({ ok: false }));
      if (j?.ok && j.url) setImageUrl(j.url as string);
      else {
        const msg: Record<string, string> = { too_large: "Image is too large (max 4MB).", bad_type: "Use a JPG, PNG or WebP image.", forbidden: "You don’t have access to this listing." };
        toast(msg[j?.reason] || "Couldn’t upload the image — try again.");
      }
    } catch {
      toast("Couldn’t upload the image — try again.");
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (s: number): string => {
    if (s === 0 && !placementKey) return "Pick where your ad should appear.";
    if (s === 1) {
      if (!startsOn || startsOn < todaySG()) return "Choose a start date from today onwards.";
    }
    if (s === 2) {
      if (title.trim().length < 3) return "Give your ad a headline.";
      if (targetUrl && !/^https:\/\//.test(targetUrl)) return "The link should start with https://";
    }
    return "";
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { setStepErr(err); return; }
    setStepErr("");
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    void submit();
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/ads/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, placementKey, startsOn, months, title: title.trim(), body: body.trim(), targetUrl: targetUrl.trim(), imageUrl, ...checkoutMeta() }),
      });
      const j = await res.json().catch(() => ({}));
      if (j?.ok && j.mode === "checkout" && j.url) {
        track.checkoutStart(placementKey, `Ad: ${placementKey} × ${months}mo`, typeof j.amount === "number" ? j.amount / 100 : undefined, { checkoutType: "ad" });
        window.location.href = j.url as string; // → Stripe; webhook schedules on payment
        return;
      }
      if (j?.ok && j.mode === "request") {
        track.ownerAction("ad_request", businessId, { ad_placement: placementKey, months });
        toast("Request received — we’ll confirm availability and invoice you by email.");
        onSubmitted();
        return;
      }
      const msg: Record<string, string> = {
        placement_unavailable: "That placement isn’t available right now.",
        placement_soldout: "That placement is fully booked for those dates — try different dates or another placement. You have not been charged.",
        bad_start_date: "Choose a start date from today onwards.",
        forbidden: "You don’t have access to this listing.",
        stripe_not_configured: "Payments aren’t available yet — try again soon.",
        stripe_error: "Payments are having a moment — you have not been charged. Please try again shortly.",
      };
      toast(msg[j?.reason] || "Couldn’t start your campaign — try again.");
    } catch {
      toast("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="flex between center wrap g10">
        <div>
          <span className="eyebrow">New campaign</span>
          <h3 style={{ fontSize: "1.2rem", marginTop: 4 }}>Promote {businessName}</h3>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={16} /> Cancel</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <WizardSteps steps={STEPS} step={step} />
      </div>

      {/* ── Step 0: placement ─────────────────────────────────────── */}
      {step === 0 && (
        <div className="stack g10" style={{ marginTop: 14 }}>
          {options === null ? (
            <div className="card" style={{ padding: 20, height: 90, opacity: 0.5 }} aria-busy="true" />
          ) : options.length === 0 ? (
            <p className="faint">No placements are open for direct sponsors right now — check back soon.</p>
          ) : (
            options.map((o) => {
              const soldOut = o.booked >= o.inventoryCap;
              const on = placementKey === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  className={`halal-opt ${on ? "on" : ""}`}
                  disabled={soldOut}
                  style={soldOut ? { opacity: 0.55 } : undefined}
                  onClick={() => setPlacementKey(o.key)}
                >
                  <div style={{ textAlign: "left" }}>
                    <div className="flex g8 center wrap">
                      <span style={{ fontWeight: 700 }}>{o.label}</span>
                      {soldOut ? (
                        <span className="pill-tag amber">Fully booked</span>
                      ) : o.booked >= Math.max(1, o.inventoryCap - 1) ? (
                        <span className="pill-tag amber">Limited</span>
                      ) : null}
                    </div>
                    <div className="faint" style={{ fontSize: ".8rem", marginTop: 2 }}>
                      {[o.pageType, o.positionLabel].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: "var(--emerald)", whiteSpace: "nowrap" }}>{money(o.monthlyRateCents)}<span className="faint" style={{ fontSize: ".76rem", fontWeight: 400 }}>/mo</span></span>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* ── Step 1: schedule ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="stack g14" style={{ marginTop: 14 }}>
          <div className="field">
            <label>Start date</label>
            <input className="input" type="date" min={todaySG()} value={startsOn} onChange={(e) => setStartsOn(e.target.value)} style={{ fontSize: 16, minHeight: 44, maxWidth: 220 }} />
          </div>
          <div className="field">
            <label>Duration</label>
            <div className="flex g8 wrap">
              {MONTH_CHOICES.map((m) => (
                <button key={m} type="button" className={`ed-chip ${months === m ? "on" : ""}`} style={months === m ? { borderColor: "var(--emerald)", color: "var(--emerald)", fontWeight: 800 } : undefined} onClick={() => setMonths(m)}>
                  {m} month{m > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>
          {placement && (
            <div className="notice">
              <Icon name="info" size={16} />
              <span><strong>{money(placement.monthlyRateCents * months)}</strong> total — {placement.label}, {months} month{months > 1 ? "s" : ""} from {startsOn}.</span>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: creative ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="ed-grid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div className="stack g12">
            <div className="field">
              <label>Headline</label>
              <input className="input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Warung Bumbu Rempah — authentic Minang" style={{ fontSize: 16, minHeight: 44 }} />
            </div>
            <div className="field">
              <label>Short text <span className="faint">(optional)</span></label>
              <textarea className="textarea" maxLength={280} value={body} onChange={(e) => setBody(e.target.value)} placeholder="One line on why people should tap." style={{ fontSize: 16, minHeight: 72 }} />
            </div>
            <div className="field">
              <label>Link <span className="faint">(optional — defaults to your listing)</span></label>
              <input className="input" type="url" inputMode="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://…" style={{ fontSize: 16, minHeight: 44 }} />
            </div>
            <div className="field">
              <label>Image <span className="faint">(JPG/PNG/WebP · 4MB)</span></label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={uploadCreative} />
              <div className="flex g8 center wrap">
                <button type="button" className="btn btn-outline btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  <Icon name="camera" size={15} /> {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
                </button>
                {imageUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImageUrl("")}><Icon name="x" size={14} /> Remove</button>}
              </div>
            </div>
            {safetyHit && (
              <div className="notice notice-warn">
                <Icon name="warning" size={16} />
                <span>This copy may touch a restricted category ({safetyHit.label}) — our team reviews every creative before it runs.</span>
              </div>
            )}
          </div>
          {/* Live preview — the exact sponsored-slot markup AdSlot serves. */}
          <div>
            <p className="faint" style={{ fontSize: ".8rem", marginBottom: 8 }}>Preview — how it appears on the site:</p>
            <div className="ad-slot">
              <div className="sponsored-slot card">
                <span className="sponsored-badge"><Icon name="star" size={12} /> Sponsored</span>
                <div className="sponsored-media">
                  <ImagePh label={title || "your ad"} tone="gold" src={imageUrl || undefined} style={{ width: "100%", height: "100%" }} />
                </div>
                <div className="sponsored-body">
                  <strong>{title || "Your headline"}</strong>
                  {body && <p className="muted" style={{ fontSize: ".88rem", marginTop: 4 }}>{body}</p>}
                </div>
                <Icon name="arrow" size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: review ───────────────────────────────────────── */}
      {step === 3 && placement && (
        <div className="stack g12" style={{ marginTop: 14 }}>
          <div className="rsb">
            {([
              ["Placement", placement.label],
              ["Runs", `${startsOn} · ${months} month${months > 1 ? "s" : ""}`],
              ["Headline", title],
              ["Link", targetUrl || "Your listing page"],
              ["Total", money(totalCents)],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="rsb-row"><span className="faint">{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
          <div className="notice">
            <Icon name="shield-check" size={16} />
            <span>Every creative is reviewed by our team before it runs (halal brand-safety policy). {paidAds ? "If a creative can’t run, we’ll contact you to fix it or refund you." : "Paid checkout opens soon — we’ll confirm availability and invoice you by email."}</span>
          </div>
        </div>
      )}

      {stepErr && (
        <div className="notice notice-warn" role="alert" style={{ marginTop: 12 }}>
          <Icon name="warning" size={16} /> <span>{stepErr}</span>
        </div>
      )}

      <WizardFooter>
        <button className="btn btn-ghost" onClick={() => (step === 0 ? onClose() : (setStepErr(""), setStep(step - 1)))}>
          {step === 0 ? "Cancel" : "Back"}
        </button>
        <button className="btn btn-primary" disabled={submitting} onClick={next}>
          {step === STEPS.length - 1
            ? submitting ? "Submitting…" : paidAds ? `Pay ${money(totalCents)} & submit for review` : "Submit request"
            : "Continue"}
          <Icon name="arrow" size={16} />
        </button>
      </WizardFooter>
    </div>
  );
}
