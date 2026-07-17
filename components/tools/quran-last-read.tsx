"use client";

/* Invisible recorder mounted on /tools/quran/[surah]: remembers the last-read
   position in localStorage only (private by default, never uploaded). Ayah
   granularity via a throttled IntersectionObserver over [data-ayah] elements;
   falls back to surah-level when none are observable. */

import { useEffect } from "react";

export const QURAN_LAST_READ_KEY = "hh_quran_last_read_v1";

export interface QuranLastRead {
  surah: number;
  surahName?: string;
  ayah?: number;
  ts: number;
}

export function QuranLastRead({ surah, surahName }: { surah: number; surahName?: string }) {
  useEffect(() => {
    const write = (ayah?: number) => {
      try {
        const cur: QuranLastRead = { surah, surahName, ayah, ts: Date.now() };
        localStorage.setItem(QURAN_LAST_READ_KEY, JSON.stringify(cur));
      } catch { /* storage unavailable — feature silently off */ }
    };
    write(); // surah-level immediately

    const targets = document.querySelectorAll("[data-ayah]");
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    let pending: number | undefined;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const n = Number((e.target as HTMLElement).dataset.ayah);
          if (Number.isFinite(n)) pending = n;
        }
        if (pending != null && !timer) {
          timer = setTimeout(() => { write(pending); timer = null; }, 1500);
        }
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => { io.disconnect(); if (timer) clearTimeout(timer); };
  }, [surah, surahName]);

  return null;
}
