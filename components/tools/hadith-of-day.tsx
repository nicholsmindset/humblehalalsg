"use client";

/* Picks "today's hadith" deterministically from the dataset by day-of-year, so
   it's stable through the day and the same for everyone. Computed on mount to
   avoid an SSR/client date mismatch. The full collection is rendered separately
   on the server for SEO. */
import { useEffect, useState } from "react";
import { HADITHS } from "@/lib/tools/hadith";

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function HadithOfDay() {
  const [idx, setIdx] = useState<number | null>(null);

  useEffect(() => {
    setIdx(dayOfYear(new Date()) % HADITHS.length);
  }, []);

  const h = idx == null ? null : HADITHS[idx];

  return (
    <div className="hadith-feature card">
      <span className="eyebrow">Hadith of the day</span>
      {h ? (
        <>
          {h.arabic && <p className="hadith-arabic" lang="ar" dir="rtl">{h.arabic}</p>}
          <p className="hadith-text">&ldquo;{h.text}&rdquo;</p>
          <span className="tag">{h.source}</span>
        </>
      ) : (
        <p className="muted">Loading today&apos;s hadith…</p>
      )}
    </div>
  );
}
