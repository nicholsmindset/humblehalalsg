"use client";

/* Owner photo manager — grid of listing photos with cover selection, ordering,
   captions and plan-capped uploads. Photo #1 is the public cover (the page hero
   and every card use photos[0]); "Set as cover" and the ◀/▶ movers are plain
   buttons so the whole thing stays keyboard-accessible without a drag library.
   Uploads go to /api/owner/photos (auth + ownership + business-photos bucket). */

import { useRef, useState, type ChangeEvent } from "react";
import { PLANS, planKey, type PlanKey } from "@/lib/plans";
import { Icon, ImagePh } from "../ui";
import { ScreenLink } from "../screen-link";

export type ManagedPhoto = { url: string; caption?: string };

const NEXT_PLAN: Partial<Record<PlanKey, PlanKey>> = { free: "verified", verified: "featured", featured: "premium" };

export function PhotoManager({
  photos,
  onChange,
  max,
  plan,
  businessId,
  toast,
}: {
  photos: ManagedPhoto[];
  onChange: (next: ManagedPhoto[]) => void;
  max: number;
  /** Current plan key — drives the upgrade nudge shown at the cap. */
  plan?: string;
  /** Set when editing an existing listing; wizard uploads omit it. */
  businessId?: string;
  toast: (m: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const atCap = photos.length >= max;
  const nextPlan = NEXT_PLAN[planKey(plan)];

  const onPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;
    setUploading(true);
    try {
      // Accumulate locally — the `photos` closure goes stale after the first
      // onChange, and uploads in one picker batch run sequentially.
      let next = photos;
      for (const file of files) {
        if (next.length >= max) { toast(`Your plan includes up to ${max} photos`); break; }
        try {
          const fd = new FormData();
          fd.set("file", file);
          if (businessId) fd.set("businessId", businessId);
          const res = await fetch("/api/owner/photos", { method: "POST", body: fd });
          const json = await res.json().catch(() => ({ ok: false }));
          if (json?.ok && json.url) {
            next = [...next, { url: json.url as string }];
            onChange(next);
          } else {
            const msg: Record<string, string> = {
              unauthenticated: "Please sign in to upload photos.",
              not_configured: "Photo uploads aren’t available yet.",
              too_large: `${file.name} is too large (max 5MB).`,
              bad_type: `${file.name} isn’t a supported image.`,
              forbidden: "You don’t have access to this listing.",
            };
            toast(msg[json?.reason] || `Couldn’t upload ${file.name}.`);
          }
        } catch {
          toast(`Couldn’t upload ${file.name}.`);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = photos.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const setCover = (i: number) => {
    if (i === 0) return;
    const next = photos.slice();
    const [p] = next.splice(i, 1);
    next.unshift(p);
    onChange(next);
  };
  const setCaption = (i: number, caption: string) => {
    const next = photos.slice();
    next[i] = caption.trim() ? { ...next[i], caption: caption.slice(0, 120) } : { url: next[i].url };
    onChange(next);
  };
  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i));

  return (
    <div className="photo-mgr">
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPicked} />
      <div className="photo-mgr-grid">
        {photos.map((p, i) => (
          <div key={p.url} className="photo-mgr-card">
            <div className="photo-mgr-img">
              <ImagePh label={p.caption || `photo ${i + 1}`} tone="gold" ratio="4/3" src={p.url} />
              {i === 0 && <span className="photo-mgr-cover"><Icon name="starf" size={11} /> Cover</span>}
            </div>
            <input
              className="input photo-mgr-cap"
              type="text"
              maxLength={120}
              placeholder={i === 0 ? "Caption your cover photo…" : "Add a caption (e.g. Beef rendang set)"}
              aria-label={`Caption for photo ${i + 1}`}
              defaultValue={p.caption || ""}
              onBlur={(e) => setCaption(i, e.target.value)}
            />
            <div className="photo-mgr-actions">
              {i !== 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCover(i)} title="Use as the main photo">
                  <Icon name="starf" size={13} /> Set as cover
                </button>
              )}
              <span className="f1" />
              <button type="button" className="btn btn-ghost btn-sm" disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`} onClick={() => move(i, -1)}>
                <Icon name="chevron" size={14} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={i === photos.length - 1} aria-label={`Move photo ${i + 1} later`} onClick={() => move(i, 1)}>
                <Icon name="chevron" size={14} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} aria-label={`Remove photo ${i + 1}`} onClick={() => remove(i)}>
                <Icon name="x" size={14} />
              </button>
            </div>
          </div>
        ))}
        {!atCap && (
          <button type="button" className="upload-zone photo-mgr-add" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Icon name="camera" size={22} />
            <span style={{ fontSize: ".8rem", fontWeight: 700, marginTop: 6 }}>{uploading ? "Uploading…" : "Add photos"}</span>
            <span className="faint" style={{ fontSize: ".72rem", marginTop: 2 }}>JPG, PNG or WebP · 5MB</span>
          </button>
        )}
      </div>
      <p className="faint" style={{ fontSize: ".78rem", marginTop: 8 }}>
        {photos.length} of {max} photos · the cover photo appears on your public page and in search results.
      </p>
      {atCap && nextPlan && (
        <div className="notice" style={{ marginTop: 8 }}>
          <Icon name="camera" size={16} />
          <span>
            You’ve used all {max} photos on your plan. Get up to {PLANS[nextPlan].galleryMax} with{" "}
            <ScreenLink screen="pricing" style={{ fontWeight: 700, textDecoration: "underline" }}>{PLANS[nextPlan].name}</ScreenLink>.
          </span>
        </div>
      )}
    </div>
  );
}
